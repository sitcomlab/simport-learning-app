import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { CapacitorSQLite } from '@capacitor-community/sqlite'
import { Plugins } from '@capacitor/core'
import { Platform } from '@ionic/angular'
import { LatLngTuple } from 'leaflet'
import {
  combineLatest,
  from,
  Observable
} from 'rxjs'
import { map } from 'rxjs/operators'
import { Trajectory, TrajectoryMeta, TrajectoryType } from '../model/trajectory'

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
    // PERFORMANCE: can't we do this with a join?
    await this.dbReady
    const { values: [meta] } = await this.db.query({
      statement: 'SELECT * FROM `trajectories` WHERE id = ?;',
      values: [id],
    })

    const { values: points } = await this.db.query({
      statement: 'SELECT * FROM `points` WHERE `trajectory` = ? ORDER BY `time`;',
      values: [id]
    })
    const coordinates: LatLngTuple[] = []
    const timestamps: Date[] = []
    for (const { lon, lat, time } of points) {
      coordinates.push([lat, lon])
      timestamps.push(new Date(time))
    }

    return new Trajectory(meta, { coordinates, timestamps})
  }

  private async initDb () {
    if (!this.isDbSupported())
      throw new Error('DB only supported on Android or iOS')

     if (this.platform.is('android'))
        await CapacitorSQLite.requestPermissions()

    // TODO: ask user to provide encryption password (assuming we keep this sqlite driver..)
    const { result, message } = await this.db.open({ database: 'trajectories' })
    if (!result) throw new Error(`unable to open DB: ${message}`)

    const { changes: { changes }, message: msg } = await this.db.execute({
      statements: DBSCHEMA,
    })
    if (changes === -1)
      throw new Error(`db init failed: ${msg}`)

    // this.insertDemoTrajectories()
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

const DBSCHEMA = `
  CREATE TABLE IF NOT EXISTS \`trajectories\` (
    \`id\` varchar(255) NOT NULL PRIMARY KEY,
    \`placename\` varchar(255)
  );

  CREATE TABLE IF NOT EXISTS \`points\` (
    \`id\` integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    \`trajectory\` varchar(255),
    \`lon\` float,
    \`lat\` float,
    \`time\` datetime,
    FOREIGN KEY(\`trajectory\`) REFERENCES \`trajectories\`(\`id\`)
  );

  CREATE INDEX IF NOT EXISTS\`points_trajectory_time_index\` ON \`points\` (
    \`trajectory\`,
    \`time\`
    );
`
