import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { CapacitorSQLite, CapacitorSQLitePlugin } from '@capacitor-community/sqlite'
import { Plugins } from '@capacitor/core'
import { Platform } from '@ionic/angular'
import {
  combineLatest,
  from,
  Observable
} from 'rxjs'
import { map } from 'rxjs/operators'
import { Trajectory, TrajectoryData, TrajectoryMeta, TrajectoryType } from '../model/trajectory'

/**
 * TrajectoryService provides access to persisted Trajectories.
 * There are different persistence mechanisms to support most platforms:
 * Example trajectories are stored as JSON under src/assets/trajectories
 * and can be loaded readonly on any platform.
 * On mobile platforms, writable storage is available via SQLite, where
 * user-provided trajectories can be stored & retrieved.
 *
 * The highlevel API aims to unify/hide these persistence mechanisms, throwing
 * errors if not available on the current platform.
 */
@Injectable()
export class TrajectoryService {
  private db = Plugins.CapacitorSQLite
  dbReady: Promise<void>

  constructor(
    private platform: Platform,
    private http: HttpClient,
  ) {
    this.dbReady = this.isDbSupported()
      ? this.initDb()
      : new Promise(() => {}) // never resolve..
  }

  // Returns an observable yielding metadata of all available trajectory metadata
  getAllMeta(): Observable<TrajectoryMeta[]> {
    // yield on each source update, once all sources have yielded once.
    return combineLatest([
      this.getReadonlyMeta(),
      this.getWritableMeta(),
    ]).pipe(
      map(val => [].concat(...val)), // flatten result arrays
    )
  }

  // Returns metadata of all trajectories stored in the (writable) database
  getWritableMeta(): Observable<TrajectoryMeta[]> {
    if (!this.isDbSupported())
      return from(Promise.resolve([]))

    // TODO: make this reactive on DB updates/inserts..?

    const promise = this.dbReady.then(async () => {
      const statement = `SELECT * FROM trajectories;`
      const { values } = await this.db.query({ statement })
      return values.map(v => new Trajectory(v))
    })
    return from(promise)
  }

  // returns metadata of all included example (readonly) trajectories
  getReadonlyMeta(): Observable<TrajectoryMeta[]> {
    return this.http.get<TrajectoryMeta[]>('assets/trajectories/index.json')
      .pipe(map(ts => ts.map(meta => new Trajectory(meta))))
  }

  // Returns any trajectory data by slug. slug consists of `type/id`.
  // TODO: catch 404 properly?
  getOne(type: TrajectoryType, id: string): Observable<Trajectory> {
    switch (type) {
      case TrajectoryType.EXAMPLE:
        const getData = this.http.get<Trajectory>(`assets/trajectories/${id}.json`)
        const getMeta = this.http.get<TrajectoryMeta[]>('assets/trajectories/index.json')
          .pipe(map(ts => ts.find(t => t.id === id)))
        return combineLatest([getMeta, getData])
          .pipe(map(([meta, data]) => new Trajectory(meta, data)))

      default:
        return from(this.getOneFromDb(id))
    }
  }

  private isDbSupported () {
    return this.platform.is("hybrid")
  }

  private async getOneFromDb(id: string): Promise<Trajectory> {
    // TODO: make this a reactive observable?
    await this.dbReady
    const { values } = await this.db.query({
      statement: `SELECT t.placename, p.lon, p.lat, p.time FROM trajectories AS t
        LEFT JOIN points p ON t.id = p.trajectory
        WHERE t.id = ?
        ORDER BY time`,
      values: [id],
    })

    if (!values.length) throw new Error('not found')

    const meta: TrajectoryMeta = {
      id,
      type: TrajectoryType.USERTRACK, // FIXME: this should come from DB..
      placename: values[0].placename,
    }

    const data = values
      // if there's no points, left join still returns one partial entry with the meta only
      .filter(({ lon }) => !!lon)

      .reduce<TrajectoryData>((data, { lon, lat, time }) => {
        data.coordinates.push([lat, lon])
        data.timestamps.push(new Date(time))
        return data
      }, { coordinates: [], timestamps: [] })

    return new Trajectory(meta, data)
  }

  private async initDb () {
    if (!this.isDbSupported())
      throw new Error('DB only supported on Android or iOS')

     if (this.platform.is('android'))
        await CapacitorSQLite.requestPermissions()

    // TODO: ask user to provide encryption password (assuming we keep this sqlite driver..)
    const { result, message } = await this.db.open({ database: 'trajectories' })
    if (!result) throw new Error(`unable to open DB: ${message}`)

    await runMigrations(this.db, MIGRATIONS)
    // await this.insertDemoTrajectories()
  }

  // private async insertDemoTrajectories() {
  //   const statements = [
  //     'INSERT OR REPLACE INTO `trajectories` (id,placename) VALUES ("muenster", "Münster")',
  //     `INSERT OR REPLACE INTO \`points\` (trajectory,lon,lat,time) VALUES
  //       ("muenster", 7.6026, 51.969,  "2020-10-01 12:00:00"),
  //       ("muenster", 7.61,   51.9678, "2020-09-01 12:00:00")
  //       `,
  //   ].join(';\n')

  //   const { changes: { changes }, message } = await this.db.execute({ statements })
  //   if (changes === -1)
  //     throw new Error(`insert demo trajectories failed: ${message}`)
  // }
}

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS trajectories (
    id varchar(255) NOT NULL PRIMARY KEY,
    placename varchar(255));
  CREATE TABLE IF NOT EXISTS points (
    id integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    trajectory varchar(255),
    lon float,
    lat float,
    time datetime,
    FOREIGN KEY(trajectory) REFERENCES trajectories(id));
  CREATE INDEX IF NOT EXISTS points_trajectory_time_index ON points (
    trajectory,
    time);`,

]


async function runMigrations (db: CapacitorSQLitePlugin, migrations: string[]) {
  const init = `CREATE TABLE IF NOT EXISTS migrations (
    version integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    up TEXT NOT NULL,
    down TEXT);`
  const { changes: { changes }, message } = await db.execute({ statements: init })
  if (changes === -1)
    throw new Error(`can't run DB migrations: ${message}`)

  const { values } = await db.query({ statement: `SELECT count() FROM migrations;` });
  const currentVersion = parseInt(values[0]['count()'])

  for (let v = currentVersion; v < migrations.length; v++)
    await runMigration(db, migrations[v], v+1)
}

async function runMigration (db: CapacitorSQLitePlugin, migration: string, targetVersion: number) {
  const set = [
    {
      statement: 'INSERT INTO migrations (version, up) VALUES (?, ?);',
      values: [targetVersion, migration]
    },
    ...migration.split(';')
      .map(s => s.trim())
      .filter(s => !!s)
      .map(statement => ({ statement, values: [] })),
  ]

  const { changes: { changes }, message } = await db.executeSet({ set })
  if (changes === -1)
    throw new Error(`DB migration to v${targetVersion} failed: ${message}`)
}
