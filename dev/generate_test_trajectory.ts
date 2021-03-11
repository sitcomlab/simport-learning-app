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
  homeToWork: 'test-data-gpx/track_home_to_work.gpx',
  work: 'test-data-gpx/track_work.gpx',
  workToHome: 'test-data-gpx/track_work_to_home.gpx',
}

function argparse() {
  const args = process.argv.slice(2)
  if (args.length == 4) {
    filepaths.home = args[0]
    filepaths.homeToWork = args[1]
    filepaths.work = args[2]
    filepaths.workToHome = args[3]
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
  const resultTrajectory = trajectory.getCopy()
  const seed = resultTrajectory.coordinates[resultTrajectory.coordinates.length - 1]
  for (var i: number = 0; i < numberPoints; i++) {
    const rand = randomGeo(seed[0], seed[1], radius)
    resultTrajectory.coordinates.push([rand.latitude, rand.longitude])
    resultTrajectory.timestamps.push(null)
  }
  return resultTrajectory
}

function addTimestampsForTrajectory(
  first: Date,
  last: Date,
  trajectory: Trajectory
): Trajectory {
  const duration = last.getTime() - first.getTime()
  const numberTimestamps = trajectory.coordinates.length
  const stepLength = duration / numberTimestamps
  const resultTrajectory = trajectory.getCopy()
  for (let i = 0; i < numberTimestamps; i++) {
    resultTrajectory.timestamps[i] = new Date(first.getTime() + i * stepLength)
  }
  return resultTrajectory
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
  filepath: string = '../src/app/shared-services/inferences/test-data/'
) {
  const fullpath = `${filepath}${trajectories.placename}.json`
  fs.writeFile(fullpath, JSON.stringify(trajectories), function (error) {
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

function getTimeDiffInMinutes(firstDate: Date, secondDate: Date): number {
  return Math.abs(firstDate.getTime() - secondDate.getTime()) / 60000
}

function getTimeDiffInHours(firstDate: Date, secondDate: Date): number {
  return getTimeDiffInMinutes(firstDate, secondDate) / 60
}

async function main() {
  argparse()

  // load data
  const baseTrajectoryHome = await loadTrajectoryFromGpxFile(filepaths.home)
  const baseTrajectoryHomeToWork = await loadTrajectoryFromGpxFile(
    filepaths.homeToWork
  )
  const baseTrajectoryWork = await loadTrajectoryFromGpxFile(filepaths.work)
  const baseTrajectoryWorkToHome = await loadTrajectoryFromGpxFile(
    filepaths.workToHome
  )

  // add temporal information
  const homeStartDate = new Date('2021-02-23T18:00:00Z')
  const homeEndDate = new Date('2021-02-24T08:45:00Z')
  const workStartDate = new Date('2021-02-24T09:00:00Z')
  const workEndDate = new Date('2021-02-24T17:00:00Z')
  const homeAfterWorkStartDate = new Date('2021-02-24T17:15:00Z')
  const homeAfterWorkEndDate = new Date('2021-02-25T08:45:00Z')

  const trajectoryHomeToWork = addTimestampsForTrajectory(
    homeEndDate,
    workStartDate,
    baseTrajectoryHomeToWork
  )

  const trajectoryWorkToHome = addTimestampsForTrajectory(
    workEndDate,
    homeAfterWorkStartDate,
    baseTrajectoryWorkToHome
  )

  /**
   * Trajectory with movement data between work and home,
   * but no clusters at either of these locations.
   */
  const trajectoryMobileOnly = combineTrajectories(
    { id: 'test-mobile-only', placename: 'test-mobile-only', type: TrajectoryType.EXAMPLE },
    [
      trajectoryHomeToWork,
      trajectoryWorkToHome
    ]
  )
  exportToJson(trajectoryMobileOnly)

  /**
   * Trajectory with movement data between work and home,
   * which includes temporally sparse clusters at both locations.
   * Contains roughly one location per hour per cluster.
   */
  const trajectoryHomeTemporallySparse = addTimestampsForTrajectory(
    homeStartDate,
    homeEndDate,
    createCluster(
      baseTrajectoryHome,
      Math.round(getTimeDiffInHours(homeStartDate, homeEndDate))
    )
  )
  const trajectoryHomeToWorkTemporallySparse = addTimestampsForTrajectory(
    homeEndDate,
    workStartDate,
    baseTrajectoryHomeToWork
  )
  const trajectoryWorkTemporallySparse = addTimestampsForTrajectory(
    homeStartDate,
    homeEndDate,
    createCluster(
      baseTrajectoryWork,
      Math.round(getTimeDiffInHours(workStartDate, workEndDate))
    )
  )
  const trajectoryWorkToHomeTemporallySparse = addTimestampsForTrajectory(
    workEndDate,
    homeAfterWorkStartDate,
    baseTrajectoryWorkToHome
  )
  const trajectoryAfterWorkTemporallySparse = addTimestampsForTrajectory(
    homeAfterWorkStartDate,
    homeAfterWorkEndDate,
    createCluster(
      baseTrajectoryHome,
      Math.round(getTimeDiffInHours(homeAfterWorkStartDate, homeAfterWorkEndDate))
    )
  )
  const trajectoryHomeWorkTemporallySparse = combineTrajectories(
    { id: 'test-home-work-temporally-sparse', placename: 'test-home-work-temporally-sparse', type: TrajectoryType.EXAMPLE },
    [
      trajectoryHomeTemporallySparse,
      trajectoryHomeToWorkTemporallySparse,
      trajectoryWorkTemporallySparse,
      trajectoryWorkToHomeTemporallySparse,
      trajectoryAfterWorkTemporallySparse
    ]
  )
  exportToJson(trajectoryHomeWorkTemporallySparse)
}

main().catch((err) => console.error(err))
