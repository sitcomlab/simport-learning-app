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
    const { values } = await this.db.query({ statement })
    return values
  }

  async getFullTrajectory(id: string): Promise<Trajectory> {
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

    const set = [
      {
        // insert or update trajectory
        statement:
          'INSERT OR REPLACE INTO trajectories (id,type,placename,durationDays) VALUES (?,?,?,?)',
        values: [id, type, placename, durationDays],
      },
    ]

    // insert or update new points query
    const numPoints = t.coordinates.length
    if (numPoints) {
      // construct query & values array
      const placeholders = []
      const values = []
      for (let i = 0; i < numPoints; i++) {
        const time = t.timestamps[i].toISOString()
        const [lat, lon] = t.coordinates[i]
        const accuracy = t.accuracy[i]
        placeholders.push(`(?,?,?,?,?)`)
        values.push(t.id, time, lat, lon, accuracy)
      }
      const placeholderString = placeholders.join(', ')
      const statement = `INSERT OR REPLACE INTO points VALUES ${placeholderString}`
      set.push({ statement, values })
    }

    const {
      changes: { changes },
      message,
    } = await this.db.executeSet({ set })
    if (changes === -1) throw new Error(`couldnt insert trajectory: ${message}`)
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
      // IDK why but with iOS simulator it was not possible to run this without .toFixed()
      values: [
        trajectoryId,
        time.toISOString(),
        p.latLng[0].toFixed(8),
        p.latLng[1].toFixed(8),
        p.accuracy,
      ],
    })
    if (changes === -1) throw new Error(`couldnt insert point: ${message}`)

    // update durationDays of trajectory
    const {
      values: [firstPoint],
    } = await this.db.query({
      statement:
        'SELECT time FROM points WHERE trajectory = ? ORDER BY TIME LIMIT 1;',
      values: [trajectoryId],
    })

    if (firstPoint) {
      const durationDays = moment(time).diff(
        moment(firstPoint.time),
        'days',
        true
      )
      await this.db.run({
        statement: 'UPDATE trajectories SET durationDays = ? WHERE id = ?;',
        values: [durationDays, trajectoryId],
      })
    }
  }
}
