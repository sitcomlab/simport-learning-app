import { Injectable } from '@angular/core'
import { CapacitorSQLite, capSQLiteSet } from '@capacitor-community/sqlite'
import { Plugins } from '@capacitor/core'
import { Platform } from '@ionic/angular'
import * as moment from 'moment'
import {
  Point,
  Trajectory,
  TrajectoryData,
  TrajectoryMeta,
} from '../../model/trajectory'
import { MIGRATIONS, runMigrations } from './migrations'

@Injectable()
export class SqliteService {
  private db = Plugins.CapacitorSQLite
  private dbReady: Promise<void>

  constructor(private platform: Platform) {}

  isSupported() {
    return this.platform.is('hybrid') // equivalent to android && ios
  }

  private ensureDbReady() {
    // call this.initDb() exactly once and return the resulting promise.
    if (this.dbReady) return this.dbReady
    return (this.dbReady = this.isSupported()
      ? this.initDb()
      : new Promise(() => {})) // never resolve..
  }

  private async initDb() {
    if (this.platform.is('android')) await CapacitorSQLite.requestPermissions()

    // TODO: ask user to provide encryption password (assuming we keep this sqlite driver..)
    const { result, message } = await this.db.open({ database: 'trajectories' })
    if (!result) throw new Error(`unable to open DB: ${message}`)

    await runMigrations(this.db, MIGRATIONS)
  }

  async getAllTrajectoryMeta(): Promise<TrajectoryMeta[]> {
    await this.ensureDbReady()
    const statement = `SELECT * FROM trajectories;`
    const { values } = await this.db.query({ statement, values: [] })

    // ensure valid duration in days
    values.forEach(async (trajectoryMeta: TrajectoryMeta) => {
      if (
        isNaN(trajectoryMeta.durationDays) ||
        trajectoryMeta.durationDays < 0
      ) {
        const durationDays = await this.updateDurationDaysInTrajectory(
          trajectoryMeta.id
        )
        trajectoryMeta.durationDays = durationDays
      }
    })
    return values
  }

  async getFullTrajectory(id: string): Promise<Trajectory> {
    await this.ensureDbReady()
    const { values } = await this.db.query({
      statement: `SELECT t.type, t.placename, t.durationDays, p.lon, p.lat, p.time, p.accuracy, p.speed FROM trajectories AS t
        LEFT JOIN points p ON t.id = p.trajectory
        WHERE t.id = ?
        ORDER BY time`,
      values: [id],
    })

    if (!values.length) throw new Error('not found')

    const { type, placename, durationDays } = values[0]
    const meta: TrajectoryMeta = { id, type, placename, durationDays }

    const data = values
      // filter partial results from LEFT JOIN (when there are no matching points)
      .filter(({ lon }) => !!lon)
      .reduce<TrajectoryData>(
        (d, { lon, lat, time, accuracy, speed }) => {
          d.timestamps.push(convertTimestampToDate(time))
          d.coordinates.push([lat, lon])
          d.accuracy.push(accuracy || 0)
          d.speed.push(speed || -1)
          return d
        },
        { coordinates: [], timestamps: [], accuracy: [], speed: [] }
      )

    return new Trajectory(meta, data)
  }

  async upsertTrajectory(t: Trajectory): Promise<void> {
    const { id, type, placename, durationDays } = t
    await this.ensureDbReady()

    const set = [
      {
        // insert or update trajectory
        statement: `INSERT INTO trajectories (id,type,placename,durationDays) VALUES (?,?,?,?)
          ON CONFLICT(id) DO UPDATE SET type=?, placename=?, durationDays=?;`,
        values: [
          id,
          type,
          placename,
          durationDays,
          type,
          placename,
          durationDays,
        ].map(normalize),
      },
    ]

    const {
      changes: { changes },
      message,
    } = await this.db.executeSet({ set })
    if (changes === -1) throw new Error(`couldnt insert trajectory: ${message}`)

    await this.upsertPointsForTrajectory(t)
  }

  async upsertPointsForTrajectory(t: Trajectory) {
    // insert or update new points query
    const numPoints = t.coordinates.length
    if (!numPoints) {
      return
    }
    // construct query & values array in chunks to prevent to many sql-statements at once
    // since the length limit of a query 'SQLITE_MAX_SQL_LENGTH' defaults to 1 000 000
    const chunkSize = 1000
    let pointsIndex = 0
    for (let chunkIndex = 0; chunkIndex < numPoints; chunkIndex += chunkSize) {
      const placeholders = []
      const values = []
      for (
        ;
        pointsIndex < chunkIndex + chunkSize && pointsIndex < numPoints;
        pointsIndex++
      ) {
        const time = t.timestamps[pointsIndex]
        const [lat, lon] = t.coordinates[pointsIndex]
        const accuracy = t.accuracy[pointsIndex] ?? 0
        const speed = t.speed[pointsIndex] ?? -1
        placeholders.push(`(?,?,?,?,?,?)`)
        values.push(t.id, time, lat, lon, accuracy, speed)
      }

      const placeholderString = placeholders.join(', ')
      const statement = `INSERT OR REPLACE INTO points VALUES ${placeholderString}`
      const set: capSQLiteSet[] = [{ statement, values: values.map(normalize) }]
      const {
        changes: { pointsChanges },
        message: pointsMessage,
      } = await this.db.executeSet({ set })
      if (pointsChanges === -1) {
        throw new Error(
          `couldnt insert points for trajectory ${t.id}: ${pointsMessage}`
        )
      }
    }
  }

  async upsertPoint(trajectoryId: string, p: Point): Promise<void> {
    const time = p.time || new Date()
    await this.dbReady

    // insert new point
    const {
      changes: { changes },
      message,
    } = await this.db.run({
      statement: 'INSERT OR REPLACE INTO points VALUES (?,?,?,?,?,?)',
      values: [trajectoryId, time, ...p.latLng, p.accuracy, p.speed].map(
        normalize
      ),
    })
    if (changes === -1) throw new Error(`couldnt insert point: ${message}`)

    // update durationDays of trajectory
    await this.updateDurationDaysInTrajectory(trajectoryId)
  }

  async deleteTrajectory(t: TrajectoryMeta): Promise<void> {
    await this.ensureDbReady()
    const statement = `DELETE  FROM trajectories WHERE id = '${t.id}';`
    const { changes, message } = await this.db.run({ statement, values: [] })
    if (changes === -1) throw new Error(`couldnt delete trajectory: ${message}`)
  }

  private async updateDurationDaysInTrajectory(
    trajectoryId: string
  ): Promise<number> {
    // update durationDays of trajectory
    const { values } = await this.db.query({
      statement:
        'SELECT MIN(time) as firstPointTime, MAX(time) as lastPointTime FROM points WHERE trajectory = ?;',
      values: [trajectoryId].map(normalize),
    })
    const { firstPointTime, lastPointTime } = values[0]
    const firstPointDate = convertTimestampToDate(firstPointTime)
    const lastPointDate = convertTimestampToDate(lastPointTime)
    const durationDays = moment(lastPointDate).diff(
      moment(firstPointDate),
      'days',
      true
    )
    await this.db.run({
      statement: 'UPDATE trajectories SET durationDays = ? WHERE id = ?;',
      values: [durationDays, trajectoryId].map(normalize),
    })
    return durationDays
  }
}

type SqlValue = Date | number | string | object

// Normalize values into a format accepted by sqlite, which is not handled correctly by
// the SqlitePlugin. There are platform-specific (sqlite-version specific?) differences.
// Does not do sql-escaping, this is done by the sql driver.
function normalize(v: SqlValue) {
  if (v === undefined) return null

  if (typeof v === 'string') return v

  // max 8 decimals, needed on iOS (emulator at least).
  // handle ints by dropping all trailing 0s
  if (typeof v === 'number') return v.toFixed(8).replace(/\.?0+$/, '')

  // convert date to timestamp (in seconds)
  if (v instanceof Date) return Math.floor(v.getTime() / 1000).toString()

  if (v instanceof Object) return JSON.stringify(v)
}

function convertTimestampToDate(timestamp: number): Date {
  // convert timestamp from seconds to milliseconds and create Date-object
  return new Date(timestamp * 1000)
}
