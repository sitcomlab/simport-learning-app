const USAGE = `ts-node -r tsconfig-paths/register --dir dev anonymize_trajectory.ts <path-to-trajectory-json>`

import * as fs from 'fs'
import haversine from 'haversine-distance'
import { Trajectory, TrajectoryData } from 'src/app/model/trajectory'

function encodeData(d: any) {
	const sep = ','
  const result = [
    '"' + ['time','d_seconds','d_meters','speed','accuracy'].join(`"${sep}"`) + '"',
  ]
  const t = Trajectory.fromJSON(d)
  for (let i = 0; i < t.coordinates.length; i++) {
    let dS = 0
    let dT = 0
    if (i > 0) {
      dS = dist(t.coordinates[i], t.coordinates[i-1])
			dT = d.timestamps[i-1]
		}
    result.push([t.timestamps[i].toISOString(), dT, dS, t.speed[i], t.accuracy[i]].join(sep))
  }
  return result.join('\r\n')
}

function dist(firstCoordinate, secondCoordinate): number {
  const a = { latitude: firstCoordinate[1], longitude: firstCoordinate[0] }
  const b = { latitude: secondCoordinate[1], longitude: secondCoordinate[0] }
  return haversine(a, b)
}

function argparse() {
  const args = process.argv.slice(2)
  if (args.length !== 1) {
    console.error(`usage: ${USAGE}`)
    process.exit(1)
  }
  const [filepath] = args
  return { filepath }
}

 
async function main() {
  const { filepath } = argparse()
  const content = fs.readFileSync(filepath, { encoding: 'utf-8' })
  const csv = encodeData(JSON.parse(content))
  console.log(csv)
}

main().catch((err) => console.error(err))
