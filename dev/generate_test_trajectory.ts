const USAGE = `ts-node --dir dev generate_test_trajectory.ts [ <gpx-file-home> <gpx-file-home-to-work> <gpx-file-work> <gpx-file-work-to-home> ]`

import { TestTrajectoryIO } from './test_trajectory_io'
import {
  Trajectory,
  TrajectoryMeta,
  TrajectoryType,
} from '../src/app/model/trajectory'

const isGpxExportEnabled = false
const isCsvExportEnabled = false

type TrajectoryTestBase = {
  homeTrajectory: Trajectory
  homeToWorkTrajectory: Trajectory
  workTrajectory: Trajectory
  workToHomeTrajectory: Trajectory
}

const filepaths = {
  home: 'test-data-gpx/track_home.gpx',
  homeToWork: 'test-data-gpx/track_home_to_work.gpx',
  work: 'test-data-gpx/track_work.gpx',
  workToHome: 'test-data-gpx/track_work_to_home.gpx',
}

const trajectoryTimes = {
  homeStartDate: new Date('2021-02-23T18:00:00Z'),
  homeEndDate: new Date('2021-02-24T08:45:00Z'),
  workStartDate: new Date('2021-02-24T09:00:00Z'),
  workEndDate: new Date('2021-02-24T17:00:00Z'),
  homeAfterWorkStartDate: new Date('2021-02-24T17:15:00Z'),
  homeAfterWorkEndDate: new Date('2021-02-25T08:45:00Z'),
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
function createMobileOnlyTrajectory(testBase: TrajectoryTestBase): Trajectory {
  const trajectoryId = 'test-mobile-only'

  const trajectoryHomeToWork = addTimestampsForTrajectory(
    trajectoryTimes.homeEndDate,
    trajectoryTimes.workStartDate,
    testBase.homeToWorkTrajectory
  )

  const trajectoryWorkToHome = addTimestampsForTrajectory(
    trajectoryTimes.workEndDate,
    trajectoryTimes.homeAfterWorkStartDate,
    testBase.workToHomeTrajectory
  )
  const trajectoryMobileOnly = combineTrajectories(
    {
      id: trajectoryId,
      placename: trajectoryId,
      type: TrajectoryType.EXAMPLE,
    },
    [trajectoryHomeToWork, trajectoryWorkToHome]
  )
  return trajectoryMobileOnly
}

/**
 * Exports trajectory with movement data between work and home,
 * which includes temporally sparse clusters at both locations.
 * Contains roughly one location per hour per cluster.
 */
function createTemporallySparseTrajectory(
  testBase: TrajectoryTestBase
): Trajectory {
  const trajectoryId = 'test-home-work-temporally-sparse'

  const trajectoryHomeTemporallySparse = addTimestampsForTrajectory(
    trajectoryTimes.homeStartDate,
    trajectoryTimes.homeEndDate,
    createCluster(
      testBase.homeTrajectory,
      Math.round(
        getTimeDiffInHours(
          trajectoryTimes.homeStartDate,
          trajectoryTimes.homeEndDate
        )
      )
    )
  )
  const trajectoryHomeToWorkTemporallySparse = addTimestampsForTrajectory(
    trajectoryTimes.homeEndDate,
    trajectoryTimes.workStartDate,
    testBase.homeToWorkTrajectory
  )
  const trajectoryWorkTemporallySparse = addTimestampsForTrajectory(
    trajectoryTimes.workStartDate,
    trajectoryTimes.workEndDate,
    createCluster(
      testBase.workTrajectory,
      Math.round(
        getTimeDiffInHours(
          trajectoryTimes.workStartDate,
          trajectoryTimes.workEndDate
        )
      )
    )
  )
  const trajectoryWorkToHomeTemporallySparse = addTimestampsForTrajectory(
    trajectoryTimes.workEndDate,
    trajectoryTimes.homeAfterWorkStartDate,
    testBase.workToHomeTrajectory
  )
  const trajectoryAfterWorkTemporallySparse = addTimestampsForTrajectory(
    trajectoryTimes.homeAfterWorkStartDate,
    trajectoryTimes.homeAfterWorkEndDate,
    createCluster(
      testBase.homeTrajectory,
      Math.round(
        getTimeDiffInHours(
          trajectoryTimes.homeAfterWorkStartDate,
          trajectoryTimes.homeAfterWorkEndDate
        )
      )
    )
  )
  const trajectoryTemporallySparse = combineTrajectories(
    {
      id: trajectoryId,
      placename: trajectoryId,
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
  return trajectoryTemporallySparse
}

/**
 * Exports trajectory with movement data between work and home,
 * which includes spacially dense clusters at both locations.
 */
function createSpatiallyDenseTrajectory(
  testBase: TrajectoryTestBase
): Trajectory {
  const trajectoryId = 'test-home-work-spatially-dense'

  const trajectoryHomeSpatiallyDense = addTimestampsForTrajectory(
    trajectoryTimes.homeStartDate,
    trajectoryTimes.homeEndDate,
    createCluster(
      testBase.homeTrajectory,
      Math.round(
        getTimeDiffInMinutes(
          trajectoryTimes.homeStartDate,
          trajectoryTimes.homeEndDate
        ) / 10
      ),
      15
    )
  )
  const trajectoryHomeToWorkSpatiallyDenseWithoutTime = insertCoordinates(
    testBase.homeToWorkTrajectory
  )
  const trajectoryHomeToWorkSpatiallyDense = addTimestampsForTrajectory(
    trajectoryTimes.homeEndDate,
    trajectoryTimes.workStartDate,
    trajectoryHomeToWorkSpatiallyDenseWithoutTime
  )
  const trajectoryWorkSpatiallyDense = addTimestampsForTrajectory(
    trajectoryTimes.workStartDate,
    trajectoryTimes.workEndDate,
    createCluster(
      testBase.workTrajectory,
      Math.round(
        getTimeDiffInHours(
          trajectoryTimes.workStartDate,
          trajectoryTimes.workEndDate
        ) / 10
      ),
      15
    )
  )
  const trajectoryWorkToHomeSpatiallyDenseWithoutTime = insertCoordinates(
    testBase.workToHomeTrajectory
  )
  const trajectoryWorkToHomeSpatiallyDense = addTimestampsForTrajectory(
    trajectoryTimes.workEndDate,
    trajectoryTimes.homeAfterWorkStartDate,
    trajectoryWorkToHomeSpatiallyDenseWithoutTime
  )
  const trajectoryAfterWorkSpatiallyDense = addTimestampsForTrajectory(
    trajectoryTimes.homeAfterWorkStartDate,
    trajectoryTimes.homeAfterWorkEndDate,
    createCluster(
      testBase.homeTrajectory,
      Math.round(
        getTimeDiffInMinutes(
          trajectoryTimes.homeAfterWorkStartDate,
          trajectoryTimes.homeAfterWorkEndDate
        ) / 10
      ),
      15
    )
  )
  const trajectorySpatiallyDense = combineTrajectories(
    {
      id: trajectoryId,
      placename: trajectoryId,
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
  return trajectorySpatiallyDense
}

/**
 * main routine, that loads data, generates various test-trajectories
 * and exports those into ../src/app/shared-services/inferences/test-data/
 */
async function main() {
  argparse()

  // load data
  const baseTrajectoryHome = await TestTrajectoryIO.loadFromGpx(filepaths.home)
  const baseTrajectoryHomeToWork = await TestTrajectoryIO.loadFromGpx(
    filepaths.homeToWork
  )
  const baseTrajectoryWork = await TestTrajectoryIO.loadFromGpx(filepaths.work)
  const baseTrajectoryWorkToHome = await TestTrajectoryIO.loadFromGpx(
    filepaths.workToHome
  )
  const trajectoryTestBase = {
    homeTrajectory: baseTrajectoryHome,
    homeToWorkTrajectory: baseTrajectoryHomeToWork,
    workTrajectory: baseTrajectoryWork,
    workToHomeTrajectory: baseTrajectoryWorkToHome,
  }

  // export various test-trajectories
  const exportTrajectories = [
    createMobileOnlyTrajectory(trajectoryTestBase),
    createTemporallySparseTrajectory(trajectoryTestBase),
    createSpatiallyDenseTrajectory(trajectoryTestBase),
  ]

  exportTrajectories.forEach((trajectory) => {
    TestTrajectoryIO.exportToJson(trajectory)
    if (isGpxExportEnabled) TestTrajectoryIO.exportToGpx(trajectory)
    if (isCsvExportEnabled) TestTrajectoryIO.exportToCsv(trajectory)
  })
}

main().catch((err) => console.error(err))
