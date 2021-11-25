import { Injectable } from '@angular/core'
import {
  CapacitorSQLite,
  capSQLiteSet,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite'
import { Plugins } from '@capacitor/core'
import { Platform } from '@ionic/angular'
import * as moment from 'moment'
import { Subject } from 'rxjs'
import { Inference } from 'src/app/model/inference'
import {
  Point,
  Trajectory,
  TrajectoryData,
  TrajectoryMeta,
} from '../../model/trajectory'
import { MIGRATIONS, runMigrations } from './migrations'
import { StayPoints } from 'src/app/model/staypoints'
import { TimetableEntry } from 'src/app/model/timetable'

@Injectable()
export class SqliteService {
  // construct query & values array in chunks to prevent to many sql-statements at once
  // since the length limit of a query 'SQLITE_MAX_SQL_LENGTH' defaults to 1 000 000
  private static chunkSize = 1000

  private sqlite = Plugins.CapacitorSQLite
  private sqliteConnection: SQLiteConnection
  private db: SQLiteDBConnection
  private dbReady: Promise<void>

  public addPointSub: Subject<Point> = new Subject()

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
    this.sqliteConnection = new SQLiteConnection(this.sqlite)
    this.db = await this.sqliteConnection.createConnection(
      'trajectories',
      false,
      'no-encryption',
      1
    )

    // TODO: ask user to provide encryption password (assuming we keep this sqlite driver..)
    const { result, message } = await this.db.open()
    if (!result) throw new Error(`unable to open DB: ${message}`)

    await runMigrations(this.db, MIGRATIONS)
  }

  async getAllTrajectoryMeta(): Promise<TrajectoryMeta[]> {
    await this.ensureDbReady()
    const statement = `SELECT * FROM trajectories;`
    const { values } = await this.db.query(statement)

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
    const { values } = await this.db.query(
      `SELECT t.type, t.placename, t.durationDays, p.lon, p.lat, p.time, p.accuracy, p.speed, p.state FROM trajectories AS t
        LEFT JOIN points p ON t.id = p.trajectory
        WHERE t.id = ?
        ORDER BY time`,
      [id]
    )

    if (!values.length) throw new Error('not found')

    const { type, placename, durationDays } = values[0]
    const meta: TrajectoryMeta = { id, type, placename, durationDays }

    const data = values
      // filter partial results from LEFT JOIN (when there are no matching points)
      .filter(({ lon }) => !!lon)
      .reduce<TrajectoryData>(
        (d, { lon, lat, time, accuracy, speed, state }) => {
          d.timestamps.push(convertTimestampToDate(time))
          d.coordinates.push([lat, lon])
          d.accuracy.push(accuracy || 0)
          d.speed.push(speed || -1)
          d.state.push(state || null)
          return d
        },
        {
          coordinates: [],
          timestamps: [],
          accuracy: [],
          speed: [],
          state: [],
        }
      )

    return new Trajectory(meta, data)
  }

  async upsertTrajectory(t: Trajectory): Promise<void> {
    const { id, type, placename, durationDays } = t
    await this.ensureDbReady()

    const set = [
      {
        // insert or update trajectory
        statement: `INSERT INTO trajectories (id, type, placename, durationDays) VALUES (?,?,?,?)
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
    } = await this.db.executeSet(set)
    if (changes === -1) throw new Error(`couldnt insert trajectory: ${message}`)

    await this.upsertPointsForTrajectory(t)
  }

  async upsertPointsForTrajectory(t: Trajectory) {
    // insert or update new points query
    const numPoints = t.coordinates.length
    if (!numPoints) return

    for (
      let chunkIndex = 0, pointsIndex = 0;
      chunkIndex < numPoints;
      chunkIndex += SqliteService.chunkSize
    ) {
      const placeholders = []
      const values = []
      for (
        ;
        pointsIndex < chunkIndex + SqliteService.chunkSize &&
        pointsIndex < numPoints;
        pointsIndex++
      ) {
        const time = t.timestamps[pointsIndex]
        const [lat, lon] = t.coordinates[pointsIndex]
        const accuracy = t.accuracy[pointsIndex] ?? 0
        const speed = t.speed[pointsIndex] ?? -1
        const state = t.state[pointsIndex] ?? null
        placeholders.push(`(?,?,?,?,?,?,?)`)
        values.push(t.id, time, lat, lon, accuracy, speed, state)
      }

      const placeholderString = placeholders.join(', ')
      const statement = `INSERT OR REPLACE INTO points VALUES ${placeholderString}`
      const set: capSQLiteSet[] = [{ statement, values: values.map(normalize) }]
      const {
        changes: { changes },
        message,
      } = await this.db.executeSet(set)
      if (changes === -1) {
        throw new Error(
          `couldnt insert points for trajectory ${t.id}: ${message}`
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
    } = await this.db.run(
      'INSERT OR REPLACE INTO points VALUES (?,?,?,?,?,?,?)',
      [trajectoryId, time, ...p.latLng, p.accuracy, p.speed, p.state].map(
        normalize
      )
    )
    if (changes === -1) throw new Error(`couldnt insert point: ${message}`)

    // update durationDays of trajectory
    await this.updateDurationDaysInTrajectory(trajectoryId)

    this.addPointSub.next(p)
  }

  async deleteTrajectory(t: TrajectoryMeta): Promise<void> {
    // delete points of trajectory manually for now, since 'ON DELETE CASCADE' fails sometimes
    await this.deletePointsOfTrajectory(t)

    await this.ensureDbReady()
    const statement = `DELETE FROM trajectories WHERE id = '${t.id}';`
    const {
      changes: { changes },
      message,
    } = await this.db.run(statement)
    if (changes === -1) throw new Error(`couldnt delete trajectory: ${message}`)
  }

  async deletePointsOfTrajectory(t: TrajectoryMeta): Promise<void> {
    await this.ensureDbReady()
    const statement = `DELETE FROM points WHERE trajectory = '${t.id}';`
    const {
      changes: { changes },
      message,
    } = await this.db.run(statement)
    if (changes === -1)
      throw new Error(`couldnt delete points of trajectory: ${message}`)
  }

  async upsertInference(inferences: Inference[]): Promise<void> {
    await this.ensureDbReady()

    const inferencesLength = inferences.length
    const timestamp = new Date()

    for (
      let chunkIndex = 0, infIndex = 0;
      chunkIndex < inferencesLength;
      chunkIndex += SqliteService.chunkSize
    ) {
      const placeholders = []
      const values = []
      for (
        ;
        infIndex < chunkIndex + SqliteService.chunkSize &&
        infIndex < inferencesLength;
        infIndex++
      ) {
        const {
          id,
          name,
          type,
          description,
          trajectoryId,
          latLng,
          confidence,
          accuracy,
          coordinatesAsPolyline,
        } = inferences[infIndex]

        if (latLng.length === 2) {
          placeholders.push(`(?,?,?,?,?,?,?,?,?,?,?)`)
          values.push(
            id,
            trajectoryId,
            type,
            timestamp,
            latLng[1],
            latLng[0],
            coordinatesAsPolyline,
            confidence,
            accuracy,
            name,
            description
          )
        }
      }

      const placeholderString = placeholders.join(', ')
      const statement = `INSERT OR REPLACE INTO inferences VALUES ${placeholderString}`
      const set: capSQLiteSet[] = [{ statement, values: values.map(normalize) }]
      const {
        changes: { changes },
        message,
      } = await this.db.executeSet(set)
      if (changes === -1) {
        throw new Error(`couldnt insert infernence: ${message}`)
      }
    }
  }

  async deleteInferences(trajectoryId: string): Promise<void> {
    await this.ensureDbReady()
    const statement = `DELETE FROM inferences WHERE trajectory='${trajectoryId}';`
    const {
      changes: { changes },
      message,
    } = await this.db.run(statement)
    if (changes === -1) throw new Error(`couldnt delete inferences: ${message}`)
  }

  async getInferences(trajectoryId: string): Promise<Inference[]> {
    await this.ensureDbReady()
    const { values } = await this.db.query(
      `SELECT * FROM inferences WHERE trajectory=?;`,
      [trajectoryId]
    )
    const inferences: Inference[] = values.map((inf) => {
      return Inference.fromObject(inf)
    }, [])
    return inferences
  }

  async getInferenceById(inferenceId: string): Promise<Inference> {
    await this.ensureDbReady()
    const { values } = await this.db.query(
      `SELECT * FROM inferences WHERE id=?;`,
      [inferenceId]
    )
    if (!values.length) return undefined
    return Inference.fromObject(values[0])
  }

  private async updateDurationDaysInTrajectory(
    trajectoryId: string
  ): Promise<number> {
    // update durationDays of trajectory
    const { values } = await this.db.query(
      'SELECT MIN(time) as firstPointTime, MAX(time) as lastPointTime FROM points WHERE trajectory = ?;',
      [trajectoryId].map(normalize)
    )
    const { firstPointTime, lastPointTime } = values[0]
    const firstPointDate = convertTimestampToDate(firstPointTime)
    const lastPointDate = convertTimestampToDate(lastPointTime)
    const durationDays = moment(lastPointDate).diff(
      moment(firstPointDate),
      'days',
      true
    )
    await this.db.run(
      'UPDATE trajectories SET durationDays = ? WHERE id = ?;',
      [durationDays, trajectoryId].map(normalize)
    )
    return durationDays
  }

  async getStaypoints(trajectoryId: string): Promise<StayPoints> {
    await this.ensureDbReady()
    const { values } = await this.db.query(
      `SELECT * FROM staypoints WHERE trajectory=? ORDER BY starttime;`,
      [trajectoryId]
    )
    // empty staypoints are to be expected and are handled in sp service
    if (!values.length) return undefined
    const data = values.reduce<StayPoints>(
      (d, { trajectory, lat, lon, starttime, endtime }) => {
        d.coordinates.push([lat, lon])
        d.starttimes.push(convertTimestampToDate(starttime))
        d.endtimes.push(convertTimestampToDate(endtime))
        return d
      },
      { trajID: trajectoryId, coordinates: [], starttimes: [], endtimes: [] }
    )
    return data
  }

  async upsertStaypoints(trajectoryId: string, stayPoints: StayPoints) {
    const numPoints = stayPoints.coordinates.length
    if (!numPoints) return

    for (
      let chunkIndex = 0, pointsIndex = 0;
      chunkIndex < numPoints;
      chunkIndex += SqliteService.chunkSize
    ) {
      const placeholders = []
      const values = []
      for (
        ;
        pointsIndex < chunkIndex + SqliteService.chunkSize &&
        pointsIndex < numPoints;
        pointsIndex++
      ) {
        const [lat, lon] = stayPoints.coordinates[pointsIndex]
        const starttime = stayPoints.starttimes[pointsIndex]
        const endtime = stayPoints.endtimes[pointsIndex]
        placeholders.push(`(?,?,?,?,?)`)
        values.push(trajectoryId, lat, lon, starttime, endtime)
      }
      const placeholderString = placeholders.join(', ')
      const statement = `INSERT OR REPLACE INTO staypoints VALUES ${placeholderString}`
      const set: capSQLiteSet[] = [{ statement, values: values.map(normalize) }]
      const {
        changes: { changes },
        message,
      } = await this.db.executeSet(set)
      if (changes === -1) {
        throw new Error(
          `couldnt insert staypoints for trajectory ${trajectoryId}: ${message}`
        )
      }
    }
  }

  async deleteStaypoints(trajectoryId: string) {
    await this.ensureDbReady()
    const statement = `DELETE FROM staypoints WHERE trajectory = '${trajectoryId}';`
    const {
      changes: { changes },
      message,
    } = await this.db.run(statement)
    if (changes === -1) throw new Error(`couldnt delete staypoints: ${message}`)
  }

  async getMostFrequentVisitByDayAndHour(
    trajectoryId: string,
    weekday: number,
    hour: number
  ): Promise<TimetableEntry[]> {
    await this.ensureDbReady()
    const { values } = await this.db.query(
      `SELECT weekday, hour, inference, count FROM timetable
      WHERE trajectory = ? AND weekday = ? AND hour = ? AND count = (
        SELECT max(count)
        from timetable
        WHERE trajectory = ? AND weekday = ? AND hour = ?
      )`,
      [trajectoryId, weekday, hour, trajectoryId, weekday, hour].map(normalize)
    )
    if (!values.length) return []

    return values.map((v) => TimetableEntry.fromJSON(v))
  }

  async getTimetable(trajectoryId: string): Promise<TimetableEntry[]> {
    await this.ensureDbReady()
    const { values } = await this.db.query(
      `SELECT weekday, hour, inference, count FROM timetable
      WHERE trajectory = ?`,
      [trajectoryId].map(normalize)
    )
    if (!values.length) return []

    return values.map((v) => TimetableEntry.fromJSON(v))
  }

  async upsertTimetable(
    visits: TimetableEntry[],
    trajectoryId: string
  ): Promise<void> {
    await this.ensureDbReady()

    const visitsLength = visits.length

    for (
      let chunkIndex = 0, visitIndex = 0;
      chunkIndex < visitsLength;
      chunkIndex += SqliteService.chunkSize
    ) {
      const placeholders = []
      const values = []
      for (
        ;
        visitIndex < chunkIndex + SqliteService.chunkSize &&
        visitIndex < visitsLength;
        visitIndex++
      ) {
        const { weekday, hour, inference, count } = visits[visitIndex]

        placeholders.push(`(?,?,?,?,?)`)
        values.push(trajectoryId, weekday, hour, inference, count)
      }

      const placeholderString = placeholders.join(', ')
      const statement = `INSERT OR REPLACE INTO timetable VALUES ${placeholderString}`
      const set: capSQLiteSet[] = [{ statement, values: values.map(normalize) }]
      const {
        changes: { changes },
        message,
      } = await this.db.executeSet(set)
      if (changes === -1) {
        throw new Error(`couldnt insert visits: ${message}`)
      }
    }
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
