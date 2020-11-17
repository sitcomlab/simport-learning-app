import { CapacitorSQLitePlugin } from '@capacitor-community/sqlite'

export async function runMigrations(
  db: CapacitorSQLitePlugin,
  migrations: string[]
) {
  const init = `CREATE TABLE IF NOT EXISTS migrations (
    version integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    up TEXT NOT NULL);`
  const {
    changes: { changes },
    message,
  } = await db.execute({ statements: init })
  if (changes === -1) throw new Error(`can't run DB migrations: ${message}`)

  const { values } = await db.query({
    statement: `SELECT count() FROM migrations;`,
    values: [],
  })
  const currentVersion = parseInt(values[0]['count()'], 10)

  for (let v = currentVersion; v < migrations.length; v++)
    await runMigration(db, migrations[v], v + 1)
}

export async function runMigration(
  db: CapacitorSQLitePlugin,
  migration: string,
  targetVersion: number
) {
  // run migration as transaction
  const set = [
    {
      statement: 'INSERT INTO migrations (version, up) VALUES (?, ?);',
      values: [targetVersion, migration],
    },
    // separate sql statements from migration
    ...migration
      .split(';')
      .map((statement) => statement.trim())
      .filter((statement) => !!statement)
      .map((statement) => ({ statement, values: [] })),
  ]

  const {
    changes: { changes },
    message,
  } = await db.executeSet({ set })
  if (changes === -1)
    throw new Error(`DB migration to v${targetVersion} failed: ${message}`)
}

export const MIGRATIONS = [
  // drop database schema from before migrations introduction
  `DROP TABLE IF EXISTS trajectories;
  DROP TABLE IF EXISTS points; `,

  // initial schema: trajectories & points table
  `CREATE TABLE IF NOT EXISTS trajectories (
    id varchar(255) NOT NULL PRIMARY KEY,
    durationDays FLOAT NULL,
    placename TEXT,
    type TEXT CHECK(type IN ("import", "track")) NOT NULL DEFAULT "import");
  CREATE TABLE IF NOT EXISTS points (
    trajectory TEXT NOT NULL,
    time datetime NOT NULL,
    lat float NOT NULL,
    lon float NOT NULL,
    accuracy float,
    PRIMARY KEY (trajectory, time),
    FOREIGN KEY (trajectory) REFERENCES trajectories(id));`,
]
