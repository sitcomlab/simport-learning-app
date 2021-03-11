const USAGE = `ts-node --dir dev generate_test_trajectory.ts [ <gpx-file-home> <gpx-file-home-to-work> <gpx-file-work> <gpx-file-work-to-home> ]`

import * as fs from 'fs'
import * as GPX from 'gpx-parse'
import * as path from 'path'
import {
  Trajectory,
  TrajectoryMeta,
  TrajectoryType,
} from '../src/app/model/trajectory'

var filepaths = {
  home: 'test-data-gpx/track_home.gpx',
  home_to_work: 'test-data-gpx/track_home_to_work.gpx',
  work: 'test-data-gpx/track_work.gpx',
  work_to_home: 'test-data-gpx/track_work_to_home.gpx',
}

function argparse() {
  const args = process.argv.slice(2)
  if (args.length == 4) {
    filepaths.home = args[0]
    filepaths.home_to_work = args[1]
    filepaths.work = args[2]
    filepaths.work_to_home = args[3]
  } else if (args.length != 0) {
    console.error(`usage: ${USAGE}`)
    process.exit(1)
  }
}

type Parser = (
  id: string,
  placename: string,
  data: string
) => Promise<Trajectory>

function getParser(input: string): Parser {
  return (id, placename, input) => {
    return new Promise((resolve, reject) => {
      GPX.parseGpx(input, (err, parsed) => {
        if (err) return reject(err)
        const coordinates = []
        const timestamps = []
        for (const track of parsed.tracks) {
          for (const waypoints of track.segments) {
            for (const { lat, lon, time } of waypoints) {
              coordinates.push([lat, lon])
              timestamps.push(time)
            }
          }
        }
        const meta = { id, placename, type: TrajectoryType.EXAMPLE }
        const data = { coordinates, timestamps }
        resolve(new Trajectory(meta, data))
      })
    })
  }
}

function createCluster(
  trajectory: Trajectory,
  numberPoints: number = 30,
  radius: number = 15
): Trajectory {
  const seed = trajectory.coordinates[trajectory.coordinates.length - 1]
  for (var i: number = 0; i < numberPoints; i++) {
    const rand = randomGeo(seed[0], seed[1], radius)
    trajectory.coordinates.push([rand.latitude, rand.longitude])
    trajectory.timestamps.push(null)
  }
  return trajectory
}

function addTimestampsForTrajectory(
  first: Date,
  last: Date,
  trajectory: Trajectory
): Trajectory {
  const duration = last.getTime() - first.getTime()
  const numberTimestamps = trajectory.coordinates.length
  const stepLength = duration / numberTimestamps
  for (let i = 0; i < numberTimestamps; i++) {
    trajectory.timestamps[i] = new Date(first.getTime() + i * stepLength)
  }
  return trajectory
}

function randomGeo(
  latitude: number,
  longitude: number,
  radiusInMeters: number
) {
  var y0 = latitude
  var x0 = longitude
  var rd = radiusInMeters / 111300

  var u = Math.random()
  var v = Math.random()

  var w = rd * Math.sqrt(u)
  var t = 2 * Math.PI * v
  var x = w * Math.cos(t)
  var y = w * Math.sin(t)

  return {
    latitude: y + y0,
    longitude: x + x0,
  }
}

function exportToCsv(trajectories: Trajectory[]) {
  let csvContent = 'latitude,longitude,timestamp\n'
  trajectories.forEach((trajectory) => {
    csvContent += trajectory.coordinates
      .map((c, i) => {
        return [c[0], c[1], trajectory.timestamps[i]?.toISOString()].join(',')
      })
      .join('\n')
    csvContent += '\n'
  })
  fs.writeFile('trajectory.csv', csvContent, function (error) {
    if (error) return console.log(error)
  })
}

function combineTrajectories(
  meta: TrajectoryMeta,
  trajectories: Trajectory[]
): Trajectory {
  var combinedTrajectory = new Trajectory(meta)
  trajectories.forEach((trajectory) => {
    trajectory.coordinates.forEach((latLng, i) => {
      combinedTrajectory.addPoint({ latLng, time: trajectory.timestamps[i] })
    })
  })
  return combinedTrajectory
}

function exportToJson(
  trajectories: Trajectory,
  filepath: string = 'trajectories.json'
) {
  fs.writeFile(filepath, JSON.stringify(trajectories), function (error) {
    if (error) return console.log(error)
  })
}

function loadTrajectoryFromGpxFile(filepath: string): Promise<Trajectory> {
  const ext = path.extname(filepath)
  if (ext != '.gpx') throw new Error('unsupported format: gpx expected')

  const id = path.basename(filepath, ext)
  const content = fs.readFileSync(filepath, { encoding: 'utf-8' })
  const parser = getParser(ext)
  return parser(id, id, content)
}

async function main() {
  argparse()

  // laod data
  let trajectory_home = await loadTrajectoryFromGpxFile(filepaths.home)
  let trajectory_home_to_work = await loadTrajectoryFromGpxFile(
    filepaths.home_to_work
  )
  let trajectory_work = await loadTrajectoryFromGpxFile(filepaths.work)
  let trajectory_work_to_home = await loadTrajectoryFromGpxFile(
    filepaths.work_to_home
  )

  // add spatial clusters
  trajectory_home = createCluster(trajectory_home)
  trajectory_work = createCluster(trajectory_work)

  // add temporal information
  const home_start = new Date('2021-02-23T18:00:00Z')
  const home_end = new Date('2021-02-24T08:45:00Z')
  const work_start = new Date('2021-02-24T09:00:00Z')
  const work_end = new Date('2021-02-24T17:00:00Z')
  const home_after_work = new Date('2021-02-24T17:15:00Z')

  trajectory_home = addTimestampsForTrajectory(
    home_start,
    home_end,
    trajectory_home
  )

  trajectory_home_to_work = addTimestampsForTrajectory(
    home_end,
    work_start,
    trajectory_home_to_work
  )

  trajectory_work = addTimestampsForTrajectory(
    work_start,
    work_end,
    trajectory_work
  )

  trajectory_work_to_home = addTimestampsForTrajectory(
    work_end,
    home_after_work,
    trajectory_work_to_home
  )

  const testTrajectory = combineTrajectories(
    { id: 'test', placename: 'institute', type: TrajectoryType.EXAMPLE },
    [
      trajectory_home,
      trajectory_home_to_work,
      trajectory_work,
      trajectory_work_to_home,
    ]
  )

  exportToJson(
    testTrajectory,
    '../src/app/shared-services/inferences/test-data/trajectories.json'
  )
}

main().catch((err) => console.error(err))
