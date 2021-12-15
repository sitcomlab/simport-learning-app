import { SQLiteDBConnection } from '@capacitor-community/sqlite'

export async function runMigrations(
  db: SQLiteDBConnection,
  migrations: string[]
) {
  const init = `CREATE TABLE IF NOT EXISTS migrations (
    version integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    up TEXT NOT NULL);`
  const {
    changes: { changes },
    message,
  } = await db.execute(init)
  if (changes === -1) throw new Error(`can't run DB migrations: ${message}`)

  const { values } = await db.query(
    `SELECT version FROM migrations ORDER BY version DESC LIMIT 1;`
  )
  const currentVersion = values.length ? parseInt(values[0].version, 10) : 0

  for (let v = currentVersion; v < migrations.length; v++)
    await runMigration(db, migrations[v], v + 1)
}

async function runMigration(
  db: SQLiteDBConnection,
  migration: string,
  targetVersion: number
) {
  // run migrations
  const {
    changes: { changes: changesMigration },
    message: messageMigration,
  } = await db.execute(migration)
  if (changesMigration === -1)
    throw new Error(
      `DB migration to v${targetVersion} failed: ${messageMigration}`
    )

  // persist migration-info
  const set = [
    {
      statement: 'INSERT INTO migrations (version, up) VALUES (?, ?);',
      values: [targetVersion, migration],
    },
  ]
  const {
    changes: { changes: changesMigrationInfo },
    message: messageMigrationInfo,
  } = await db.executeSet(set)
  if (changesMigrationInfo === -1)
    throw new Error(
      `Persisting DB migration information to v${targetVersion} failed: ${messageMigrationInfo}`
    )
}

export const MIGRATIONS = [
  // drop database schema from before migrations introduction
  `DROP TABLE IF EXISTS trajectories;
  DROP TABLE IF EXISTS points;`,

  // initial schema: trajectories & points table
  `CREATE TABLE IF NOT EXISTS trajectories (
    id varchar(255) NOT NULL PRIMARY KEY,
    durationDays FLOAT NULL,
    placename TEXT,
    type TEXT CHECK(type IN ("import", "track")) NOT NULL DEFAULT "import");
  CREATE TABLE IF NOT EXISTS points (
    trajectory TEXT NOT NULL,
    time DATETIME NOT NULL,
    lat float NOT NULL,
    lon float NOT NULL,
    accuracy float,
    PRIMARY KEY (trajectory, time),
    FOREIGN KEY (trajectory) REFERENCES trajectories(id) ON DELETE CASCADE);`,

  // remove potential duplicate points with very similar timestamp
  // update date from iso-strings to timestamps and invalidate durationDays for recalculation
  `DELETE FROM points WHERE time NOT IN (
    SELECT TIME FROM points GROUP BY strftime('%s', time));
  UPDATE points SET time=strftime('%s', time);
  UPDATE trajectories SET durationDays=null;`,

  // add index to column 'trajectory' in table 'points', since points are mostly accessed via trajectories
  // this indexing improves performance sql-requests
  `CREATE INDEX pointsTrajectoryIndex ON points(trajectory);`,

  // add field 'speed' to table points
  `ALTER TABLE points ADD COLUMN speed float DEFAULT -1;`,

  // add inferences persistence
  `CREATE TABLE IF NOT EXISTS inferences (
    trajectory TEXT NOT NULL,
    type TEXT NOT NULL,
    updated DATETIME NOT NULL,
    lon FLOAT NOT NULL,
    lat FLOAT NOT NULL,
    coordinates TEXT,
    confidence FLOAT,
    accuracy FLOAT,
    name TEXT,
    description TEXT,
    PRIMARY KEY (trajectory, type, lon, lat),
    FOREIGN KEY (trajectory) REFERENCES trajectories(id) ON DELETE CASCADE);`,

  // add staypoint persistence
  `CREATE TABLE IF NOT EXISTS staypoints (
    trajectory TEXT NOT NULL,
    lat FLOAT NOT NULL,
    lon FLOAT NOT NULL,
    starttime DATETIME NOT NULL,
    endtime DATETIME NOT NULL,
    PRIMARY KEY (trajectory, starttime),
    FOREIGN KEY (trajectory) REFERENCES trajectories(id) ON DELETE CASCADE);`,

  // add field 'start' to table points
  `ALTER TABLE points ADD COLUMN state TEXT`,

  // add geocoding persistence
  `CREATE TABLE IF NOT EXISTS reverseGeocoding (
    lat FLOAT NOT NULL,
    lon FLOAT NOT NULL,
    geocoding TEXT,
    PRIMARY KEY (lat, lon));`,

  // add primary key 'id' to table inferendes
  // drop table inferences beforehand
  `DROP TABLE IF EXISTS inferences;`,

  // create new inferences table with ids
  `CREATE TABLE IF NOT EXISTS inferences (
      id varchar(255) NOT NULL PRIMARY KEY,
      trajectory TEXT NOT NULL,
      type TEXT NOT NULL,
      updated DATETIME NOT NULL,
      lon FLOAT NOT NULL,
      lat FLOAT NOT NULL,
      coordinates TEXT,
      confidence FLOAT,
      accuracy FLOAT,
      name TEXT,
      description TEXT,
      FOREIGN KEY (trajectory) REFERENCES trajectories(id) ON DELETE CASCADE);`,

  `CREATE TABLE IF NOT EXISTS timetable (
      trajectory TEXT NOT NULL,
      weekday INTEGER NOT NULL,
      hour INTEGER NOT NULL,
      inference TEXT NOT NULL,
      count INTEGER NOT NULL,
      PRIMARY KEY (trajectory, weekday, hour, inference),
      FOREIGN KEY (trajectory) REFERENCES trajectories(id) ON DELETE CASCADE,
      FOREIGN KEY (inference) REFERENCES inferences(id) ON DELETE CASCADE);`,

  // creat diary table
  `CREATE TABLE IF NOT EXISTS diaryEntry (
      id varchar(255) NOT NULL PRIMARY KEY,
      created DATETIME NOT NULL,
      updated DATETIME NOT NULL,
      date DATETIME NOT NULL,
      content TEXT NOT NULL);`,
]
