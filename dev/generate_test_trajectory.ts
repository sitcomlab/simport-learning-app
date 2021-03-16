const USAGE = `ts-node --dir dev generate_test_trajectory.ts [ <gpx-file-home> <gpx-file-home-to-work> <gpx-file-work> <gpx-file-work-to-home> ]`

import * as fs from 'fs'
import * as GPX from 'gpx-parse'
import * as path from 'path'
import createGpx from 'gps-to-gpx'
import {
  Trajectory,
  TrajectoryMeta,
  TrajectoryType,
} from '../src/app/model/trajectory'

type TrajectoryTestBase = {
  homeTrajectory: Trajectory
  homeToWorkTrajectory: Trajectory
  workTrajectory: Trajectory
  workToHomeTrajectory: Trajectory
}

type Parser = (
  id: string,
  placename: string,
  data: string
) => Promise<Trajectory>

type GpxWaypoint = {
  latitude: number
  longitude: number
  time: string
}

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
  radius: number = 30
): Trajectory {
  const resultTrajectory = trajectory.getCopy()
  const seed =
    resultTrajectory.coordinates[resultTrajectory.coordinates.length - 1]
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

function insertCoordinates(
  trajectory: Trajectory,
  numberOfInsertSteps: number = 1
) {
  const resultTrajectory = trajectory.getCopy()
  const numberCoordinates = trajectory.coordinates.length
  for (
    let i = 0, j = 0;
    i < numberCoordinates - 1;
    i++, j += numberOfInsertSteps
  ) {
    const firstCoordinate = trajectory.coordinates[i]
    const secondCoordinate = trajectory.coordinates[i + 1]
    const insertCoordinate = randomGeo(
      (firstCoordinate[0] + secondCoordinate[0]) / 2,
      (firstCoordinate[1] + secondCoordinate[1]) / 2,
      0.5
    )
    resultTrajectory.coordinates.splice(i + j + 1, 0, [
      insertCoordinate.latitude,
      insertCoordinate.longitude,
    ])
    resultTrajectory.timestamps.splice(i + j + 1, 0, null)
  }
  return resultTrajectory
}

function randomGeo(
  latitude: number,
  longitude: number,
  radiusInMeters: number
) {
  const y0 = latitude
  const x0 = longitude
  const rd = radiusInMeters / 111300

  const u = Math.random()
  const v = Math.random()

  const w = rd * Math.sqrt(u)
  const t = 2 * Math.PI * v
  const x = w * Math.cos(t)
  const y = w * Math.sin(t)

  return {
    latitude: y + y0,
    longitude: x + x0,
  }
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
  trajectory: Trajectory,
  filepath: string = '../src/app/shared-services/inferences/test-data/'
) {
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath)
  }
  const fullpath = `${filepath}${trajectory.placename}.json`
  fs.writeFile(fullpath, JSON.stringify(trajectory), function (error) {
    if (error) return console.log(error)
  })
}

function exportToGpx(
  trajectory: Trajectory,
  filepath: string = '../src/app/shared-services/inferences/test-data/'
) {
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath)
  }
  const waypoints = trajectory.coordinates.reduce<GpxWaypoint[]>(
    (waypoint, c, index, coords) => {
      waypoint.push({
        latitude: coords[index][0],
        longitude: coords[index][1],
        time: trajectory.timestamps[index].toISOString(),
      })
      return waypoint
    },
    []
  )
  const gpx = createGpx(waypoints, {
    activityName: trajectory.placename,
    startTime: trajectory.timestamps[0],
  })
  const fullpath = `${filepath}${trajectory.placename}.gpx`
  fs.writeFile(fullpath, gpx, function (error) {
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

/**
 * Exports trajectory with movement data between work and home,
 * but no clusters at either of these locations.
 */
function exportMobileOnlyTrajectory(
  trajectoryTestBase: TrajectoryTestBase,
  isDebugGpxExportEnabled: boolean
) {
  const homeEndDate = new Date('2021-02-24T08:45:00Z')
  const workStartDate = new Date('2021-02-24T09:00:00Z')
  const workEndDate = new Date('2021-02-24T17:00:00Z')
  const homeAfterWorkStartDate = new Date('2021-02-24T17:15:00Z')

  const trajectoryHomeToWork = addTimestampsForTrajectory(
    homeEndDate,
    workStartDate,
    trajectoryTestBase.homeToWorkTrajectory
  )

  const trajectoryWorkToHome = addTimestampsForTrajectory(
    workEndDate,
    homeAfterWorkStartDate,
    trajectoryTestBase.workToHomeTrajectory
  )
  const trajectoryMobileOnly = combineTrajectories(
    {
      id: 'test-mobile-only',
      placename: 'test-mobile-only',
      type: TrajectoryType.EXAMPLE,
    },
    [trajectoryHomeToWork, trajectoryWorkToHome]
  )
  exportToJson(trajectoryMobileOnly)

  if (isDebugGpxExportEnabled) {
    exportToGpx(trajectoryMobileOnly)
  }
}

/**
 * Exports trajectory with movement data between work and home,
 * which includes temporally sparse clusters at both locations.
 * Contains roughly one location per hour per cluster.
 */
function exportHomeWorkTemporallySparseTrajectory(
  trajectoryTestBase: TrajectoryTestBase,
  isDebugGpxExportEnabled: boolean
) {
  const homeStartDate = new Date('2021-02-23T18:00:00Z')
  const homeEndDate = new Date('2021-02-24T08:45:00Z')
  const workStartDate = new Date('2021-02-24T09:00:00Z')
  const workEndDate = new Date('2021-02-24T17:00:00Z')
  const homeAfterWorkStartDate = new Date('2021-02-24T17:15:00Z')
  const homeAfterWorkEndDate = new Date('2021-02-25T08:45:00Z')

  const trajectoryHomeTemporallySparse = addTimestampsForTrajectory(
    homeStartDate,
    homeEndDate,
    createCluster(
      trajectoryTestBase.homeTrajectory,
      Math.round(getTimeDiffInHours(homeStartDate, homeEndDate))
    )
  )
  const trajectoryHomeToWorkTemporallySparse = addTimestampsForTrajectory(
    homeEndDate,
    workStartDate,
    trajectoryTestBase.homeToWorkTrajectory
  )
  const trajectoryWorkTemporallySparse = addTimestampsForTrajectory(
    workStartDate,
    workEndDate,
    createCluster(
      trajectoryTestBase.workTrajectory,
      Math.round(getTimeDiffInHours(workStartDate, workEndDate))
    )
  )
  const trajectoryWorkToHomeTemporallySparse = addTimestampsForTrajectory(
    workEndDate,
    homeAfterWorkStartDate,
    trajectoryTestBase.workToHomeTrajectory
  )
  const trajectoryAfterWorkTemporallySparse = addTimestampsForTrajectory(
    homeAfterWorkStartDate,
    homeAfterWorkEndDate,
    createCluster(
      trajectoryTestBase.homeTrajectory,
      Math.round(
        getTimeDiffInHours(homeAfterWorkStartDate, homeAfterWorkEndDate)
      )
    )
  )
  const trajectoryTemporallySparse = combineTrajectories(
    {
      id: 'test-home-work-temporally-sparse',
      placename: 'test-home-work-temporally-sparse',
      type: TrajectoryType.EXAMPLE,
    },
    [
      trajectoryHomeTemporallySparse,
      trajectoryHomeToWorkTemporallySparse,
      trajectoryWorkTemporallySparse,
      trajectoryWorkToHomeTemporallySparse,
      trajectoryAfterWorkTemporallySparse,
    ]
  )
  exportToJson(trajectoryTemporallySparse)

  if (isDebugGpxExportEnabled) {
    exportToGpx(trajectoryTemporallySparse)
  }
}

/**
 * Exports trajectory with movement data between work and home,
 * which includes spacially dense clusters at both locations.
 */
function exportHomeWorkSpatiallyDenseTrajectory(
  trajectoryTestBase: TrajectoryTestBase,
  isDebugGpxExportEnabled: boolean
) {
  const homeStartDate = new Date('2021-02-23T18:00:00Z')
  const homeEndDate = new Date('2021-02-24T08:45:00Z')
  const workStartDate = new Date('2021-02-24T09:00:00Z')
  const workEndDate = new Date('2021-02-24T17:00:00Z')
  const homeAfterWorkStartDate = new Date('2021-02-24T17:15:00Z')
  const homeAfterWorkEndDate = new Date('2021-02-25T08:45:00Z')

  const trajectoryHomeSpatiallyDense = addTimestampsForTrajectory(
    homeStartDate,
    homeEndDate,
    createCluster(
      trajectoryTestBase.homeTrajectory,
      Math.round(getTimeDiffInMinutes(homeStartDate, homeEndDate) / 20),
      15
    )
  )
  const trajectoryHomeToWorkSpatiallyDenseWithoutTime = insertCoordinates(
    trajectoryTestBase.homeToWorkTrajectory
  )
  const trajectoryHomeToWorkSpatiallyDense = addTimestampsForTrajectory(
    homeEndDate,
    workStartDate,
    trajectoryHomeToWorkSpatiallyDenseWithoutTime
  )
  const trajectoryWorkSpatiallyDense = addTimestampsForTrajectory(
    workStartDate,
    workEndDate,
    createCluster(
      trajectoryTestBase.workTrajectory,
      Math.round(getTimeDiffInHours(workStartDate, workEndDate) / 20),
      15
    )
  )
  const trajectoryWorkToHomeSpatiallyDenseWithoutTime = insertCoordinates(
    trajectoryTestBase.workToHomeTrajectory
  )
  const trajectoryWorkToHomeSpatiallyDense = addTimestampsForTrajectory(
    workEndDate,
    homeAfterWorkStartDate,
    trajectoryWorkToHomeSpatiallyDenseWithoutTime
  )
  const trajectoryAfterWorkSpatiallyDense = addTimestampsForTrajectory(
    homeAfterWorkStartDate,
    homeAfterWorkEndDate,
    createCluster(
      trajectoryTestBase.homeTrajectory,
      Math.round(
        getTimeDiffInMinutes(homeAfterWorkStartDate, homeAfterWorkEndDate) / 20
      ),
      15
    )
  )
  const trajectorySpatiallyDense = combineTrajectories(
    {
      id: 'test-home-work-spatially-dense',
      placename: 'test-home-work-spatially-dense',
      type: TrajectoryType.EXAMPLE,
    },
    [
      trajectoryHomeSpatiallyDense,
      trajectoryHomeToWorkSpatiallyDense,
      trajectoryWorkSpatiallyDense,
      trajectoryWorkToHomeSpatiallyDense,
      trajectoryAfterWorkSpatiallyDense,
    ]
  )
  exportToJson(trajectorySpatiallyDense)

  if (isDebugGpxExportEnabled) {
    exportToGpx(trajectorySpatiallyDense)
  }
}

/**
 * main routine, that loads data, generates various test-trajectories
 * and exports those into ../src/app/shared-services/inferences/test-data/
 */
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
  const trajectoryTestBase = {
    homeTrajectory: baseTrajectoryHome,
    homeToWorkTrajectory: baseTrajectoryHomeToWork,
    workTrajectory: baseTrajectoryWork,
    workToHomeTrajectory: baseTrajectoryWorkToHome,
  }
  const isDebugGpxExportEnabled = false

  // export various test-trajectories
  exportMobileOnlyTrajectory(trajectoryTestBase, isDebugGpxExportEnabled)
  exportHomeWorkTemporallySparseTrajectory(
    trajectoryTestBase,
    isDebugGpxExportEnabled
  )
  exportHomeWorkSpatiallyDenseTrajectory(
    trajectoryTestBase,
    isDebugGpxExportEnabled
  )
}

main().catch((err) => console.error(err))
