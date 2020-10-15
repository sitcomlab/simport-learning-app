import { Injectable } from '@angular/core'
import { Plugins } from '@capacitor/core'
import { CapacitorSQLite } from '@capacitor-community/sqlite'
import { Trajectory } from '../model/trajectory'
import { Platform } from '@ionic/angular'

@Injectable()
export class TrajectoryService {
  private db = Plugins.CapacitorSQLite
  dbReady: Promise<void>

  constructor(
    private platform: Platform,
  ) {
    this.dbReady = this.initDb()
    this.insertDemoTrajectories()
  }

  async getAllTrajectories(): Promise<Trajectory[]> {
    await this.dbReady
    const statement = `SELECT id FROM trajectories;`
    const { values } = await this.db.query({ statement })
    const ts = values as Omit<Trajectory, 'timestamps' | 'coordinates'>[]
    return Promise.all(ts.map(t => this.getTrajectory(t.id)))
  }

  async getTrajectory(id: string) {
    // PERFORMANCE: can't we do this with a join?
    await this.dbReady
    const { values } = await this.db.query({
      statement: 'SELECT * FROM `trajectories` WHERE id = ?;',
      values: [id],
    })
    const t = values[0] as Trajectory

    const { values: points } = await this.db.query({
      statement: 'SELECT * FROM `points` WHERE `trajectory` = ? ORDER BY `time`;',
      values: [id]
    })
    t.coordinates = points.map(({ lon, lat }) => [lat, lon])
    t.timestamps  = points.map(({ time }) => new Date(time))
    return t
  }

  private async initDb () {
    // TODO: handle web platform..
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
  }

  private async insertDemoTrajectories() {
    await this.dbReady
    const statements = [
      'INSERT OR REPLACE INTO `trajectories` (id,placename) VALUES ("muenster", "Münster")',
      `INSERT OR REPLACE INTO \`points\` (trajectory,lon,lat,time) VALUES
        ("muenster", 7.6026, 51.969,  "2020-10-01 12:00:00"),
        ("muenster", 7.61,   51.9678, "2020-09-01 12:00:00")
        `,
    ].join(';\n')

    const { changes: { changes }, message } = await this.db.execute({ statements })
    if (changes === -1)
      throw new Error(`insert demo trajectories failed: ${message}`)
  }
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
