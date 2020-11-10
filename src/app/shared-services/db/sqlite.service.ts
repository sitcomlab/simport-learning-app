import { Injectable } from '@angular/core'
import { CapacitorSQLite } from '@capacitor-community/sqlite'
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
    return this.platform.is('hybrid')
  }

  private ensureDbReady() {
    // call this.initDb() exactly once and return the resulting promise.
    if (this.dbReady) return this.dbReady
    return (this.dbReady = this.isSupported()
      ? this.initDb()
      : new Promise(() => {})) // never resolve..
  }

  private async initDb() {
    if (!this.isSupported())
      throw new Error('DB only supported on Android or iOS')

    if (this.platform.is('android')) await CapacitorSQLite.requestPermissions()

    // TODO: ask user to provide encryption password (assuming we keep this sqlite driver..)
    const { result, message } = await this.db.open({ database: 'trajectories' })
    if (!result) throw new Error(`unable to open DB: ${message}`)

    await runMigrations(this.db, MIGRATIONS)
  }

  async getAllTrajectoryMeta() {
    await this.ensureDbReady()
    const statement = `SELECT * FROM trajectories;`
    const { values } = await this.db.query({ statement })
    return values.map((v) => new Trajectory(v))
  }

  async getFullTrajectory(id: string) {
    await this.ensureDbReady()
    const { values } = await this.db.query({
      statement: `SELECT t.type, t.placename, t.durationDays, p.lon, p.lat, p.time, p.accuracy FROM trajectories AS t
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
        (d, { lon, lat, time, accuracy }) => {
          d.timestamps.push(new Date(time))
          d.coordinates.push([lat, lon])
          d.accuracy.push(accuracy)
          return d
        },
        { coordinates: [], timestamps: [], accuracy: [] }
      )

    return new Trajectory(meta, data)
  }

  async upsertTrajectory(t: Trajectory): Promise<void> {
    const { id, type, placename, durationDays } = t
    await this.ensureDbReady()

    // insert or update trajectory
    const {
      changes: { changes },
      message,
    } = await this.db.run({
      statement:
        'INSERT OR REPLACE INTO trajectories (id,type,placename,durationDays) VALUES (?,?,?,?)',
      values: [id, type, placename, durationDays],
    })
    if (changes === -1) throw new Error(`couldnt insert trajectory: ${message}`)

    // insert or update new points.
    if (t.coordinates.length) {
      const pointsQuery = 'INSERT OR REPLACE INTO points VALUES '
      const pointsValues = t.points
        .map(
          ({ time, accuracy, latLng: [lat, lon] }) =>
            `(${t.id},${time.toISOString()},${lon},${lat},${
              accuracy || 'NULL'
            })`
        )
        .join(', ')
      const {
        changes: { changes: ch2 },
        message: m2,
      } = await this.db.run({
        statement: `${pointsQuery} ${pointsValues};`,
      })
      if (ch2 === -1) throw new Error(`couldnt insert trajectory: ${m2}`)
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
      statement: 'INSERT OR REPLACE INTO points VALUES (?,?,?,?,?)',
      values: [trajectoryId, time.toISOString(), ...p.latLng, p.accuracy],
    })
    if (changes === -1) throw new Error(`couldnt insert trajectory: ${message}`)

    // update durationDays of trajectory
    const {
      values: [firstPoint],
    } = await this.db.query({
      statement:
        'SELECT time FROM points WHERE trajectory = ? ORDER BY TIME LIMIT 1;',
      values: [trajectoryId],
    })

    if (firstPoint) {
      const durationDays =
        moment(time).diff(moment(firstPoint.time), 'minutes') / 1440
      await this.db.run({
        statement: 'UPDATE trajectories SET durationDays = ? WHERE id = ?;',
        values: [durationDays, trajectoryId],
      })
    }
  }
}
