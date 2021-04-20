const USAGE = `ts-node -r tsconfig-paths/register --dir dev generate_test_trajectory.ts [ <gpx-file-home> <gpx-file-home-to-work> <gpx-file-work> <gpx-file-work-to-home> ]`

import {
  Trajectory,
  TrajectoryMeta,
  TrajectoryType,
} from 'src/app/model/trajectory'
import { TestTrajectoryIO } from './test_trajectory_io'

const isGpxExportEnabled = false
const isCsvExportEnabled = false

type TrajectoryTestBase = {
  homeTrajectory: Trajectory
  homeToWorkTrajectory: Trajectory
  workTrajectory: Trajectory
  workToHomeTrajectory: Trajectory
}

const filepaths = {
  home: __dirname + '/test-data-gpx/track_home.gpx',
  homeToWork: __dirname + '/test-data-gpx/track_home_to_work.gpx',
  work: __dirname + '/test-data-gpx/track_work.gpx',
  workToHome: __dirname + '/test-data-gpx/track_work_to_home.gpx',
}

const testDataNames = {
  mobileOnly: 'test-mobile-only',
  homeWork: 'test-home-work',
  spatiallyDense: 'test-home-work-spatially-dense',
  temporallySparse: 'test-home-work-temporally-sparse',
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
  minRadius: number = 3,
  maxRadius: number = 30
): Trajectory {
  const resultTrajectory = trajectory.getCopy()
  const seed =
    resultTrajectory.coordinates[resultTrajectory.coordinates.length - 1]
  for (var i: number = 0; i < numberPoints; i++) {
    const rand = randomGeo(seed[0], seed[1], minRadius, maxRadius)
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

/**
 * Interpolates and adds additional coordinates in between given set of coordinates.
 * For simplicity this treats latitude and longitude like Cartesian coordinates on a flat plane.
 * Lat and lon are coordinates on an ellipsoid and this should rather interpolate between two coordinates on an arc than a straight line.
 *
 * @param trajectory which holds coordinates
 * @param numberOfInsertsPerCoordinate number of interpolated points between each pair of subsequent coordinates
 * @returns interpolated trajectory
 */
function interpolateCoordinates(
  trajectory: Trajectory,
  numberOfInsertsPerCoordinate: number = 1
) {
  if (numberOfInsertsPerCoordinate < 1) {
    return trajectory
  }
  const resultTrajectory = trajectory.getCopy()
  const numberCoordinates = trajectory.coordinates.length
  for (let index = 0, indexShift = 0; index < numberCoordinates - 1; index++) {
    const [firstLat, firstLng] = trajectory.coordinates[index]
    const [secondLat, secondLng] = trajectory.coordinates[index + 1]
    const latDiff = firstLat - secondLat
    const lngDiff = firstLng - secondLng
    for (
      let insertIndex = 1;
      insertIndex <= numberOfInsertsPerCoordinate;
      insertIndex++, indexShift++
    ) {
      const latSeed =
        firstLat + latDiff * (insertIndex / numberOfInsertsPerCoordinate)
      const lngSeed =
        firstLng + lngDiff * (insertIndex / numberOfInsertsPerCoordinate)
      const insertCoordinate = randomGeo(latSeed, lngSeed, 0.25, 0.5)
      resultTrajectory.coordinates.splice(index + indexShift + 1, 0, [
        insertCoordinate.latitude,
        insertCoordinate.longitude,
      ])
      resultTrajectory.timestamps.splice(index + indexShift + 1, 0, null)
    }
  }
  return resultTrajectory
}

function randomGeo(
  latitude: number,
  longitude: number,
  minRadiusInMeters: number,
  maxRadiusInMeters: number
) {
  const randRadius =
    (minRadiusInMeters +
      Math.random() * (maxRadiusInMeters - minRadiusInMeters)) *
    randomSign()
  const rd = randRadius / 111300

  const u = Math.random()
  const v = Math.random()

  const w = rd * Math.sqrt(u)
  const t = 2 * Math.PI * v
  const x = w * Math.cos(t)
  const y = w * Math.sin(t)

  return {
    latitude: latitude + y,
    longitude: longitude + x,
  }
}

function randomSign(): number {
  return Math.random() < 0.5 ? -1 : 1
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

function computeNumberOfPointsPerHour(
  firstDate: Date,
  secondDate: Date,
  pointsPerHour: number = 1
): number {
  return Math.round(getTimeDiffInHours(firstDate, secondDate) * pointsPerHour)
}

function computeNumberOfPointsPerMinute(
  firstDate: Date,
  secondDate: Date,
  pointsPerMinute: number
): number {
  return Math.round(
    getTimeDiffInMinutes(firstDate, secondDate) * pointsPerMinute
  )
}

/**
 * Exports trajectory with movement data between work and home,
 * but no clusters at either of these locations.
 */
function createMobileOnlyTrajectory(testBase: TrajectoryTestBase): Trajectory {
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
      id: testDataNames.mobileOnly,
      placename: testDataNames.mobileOnly,
      type: TrajectoryType.EXAMPLE,
    },
    [trajectoryHomeToWork, trajectoryWorkToHome]
  )
  return trajectoryMobileOnly
}

/**
 * Exports trajectory with movement data between work and home.
 * Contains few  basic locations at home & work, but no clusters.
 */
function createHomeWorkTrajectory(testBase: TrajectoryTestBase): Trajectory {
  const clusterPointsPerHour = 10
  const trajectoryHome = addTimestampsForTrajectory(
    trajectoryTimes.homeStartDate,
    trajectoryTimes.homeEndDate,
    createCluster(
      testBase.homeTrajectory,
      computeNumberOfPointsPerHour(
        trajectoryTimes.homeStartDate,
        trajectoryTimes.homeEndDate,
        clusterPointsPerHour
      )
    )
  )
  const trajectoryHomeToWork = addTimestampsForTrajectory(
    trajectoryTimes.homeEndDate,
    trajectoryTimes.workStartDate,
    testBase.homeToWorkTrajectory
  )
  const trajectoryWork = addTimestampsForTrajectory(
    trajectoryTimes.workStartDate,
    trajectoryTimes.workEndDate,
    createCluster(
      testBase.workTrajectory,
      computeNumberOfPointsPerHour(
        trajectoryTimes.workStartDate,
        trajectoryTimes.workEndDate,
        clusterPointsPerHour
      )
    )
  )
  const trajectoryWorkToHome = addTimestampsForTrajectory(
    trajectoryTimes.workEndDate,
    trajectoryTimes.homeAfterWorkStartDate,
    testBase.workToHomeTrajectory
  )
  const trajectoryHomeAfterWork = addTimestampsForTrajectory(
    trajectoryTimes.homeAfterWorkStartDate,
    trajectoryTimes.homeAfterWorkEndDate,
    createCluster(
      testBase.homeTrajectory,
      computeNumberOfPointsPerHour(
        trajectoryTimes.homeAfterWorkStartDate,
        trajectoryTimes.homeAfterWorkEndDate,
        clusterPointsPerHour
      )
    )
  )
  const trajectoryHomeWork = combineTrajectories(
    {
      id: testDataNames.homeWork,
      placename: testDataNames.homeWork,
      type: TrajectoryType.EXAMPLE,
    },
    [
      trajectoryHome,
      trajectoryHomeToWork,
      trajectoryWork,
      trajectoryWorkToHome,
      trajectoryHomeAfterWork,
    ]
  )
  return trajectoryHomeWork
}

/**
 * Exports trajectory with movement data between work and home,
 * which includes temporally sparse clusters at both locations.
 * Contains roughly one location per hour per cluster.
 */
function createTemporallySparseTrajectory(
  testBase: TrajectoryTestBase
): Trajectory {
  const trajectoryHomeTemporallySparse = addTimestampsForTrajectory(
    trajectoryTimes.homeStartDate,
    trajectoryTimes.homeEndDate,
    createCluster(
      testBase.homeTrajectory,
      computeNumberOfPointsPerHour(
        trajectoryTimes.homeStartDate,
        trajectoryTimes.homeEndDate
      )
    )
  )
  const trajectoryHomeToWork = addTimestampsForTrajectory(
    trajectoryTimes.homeEndDate,
    trajectoryTimes.workStartDate,
    testBase.homeToWorkTrajectory
  )
  const trajectoryWorkTemporallySparse = addTimestampsForTrajectory(
    trajectoryTimes.workStartDate,
    trajectoryTimes.workEndDate,
    createCluster(
      testBase.workTrajectory,
      computeNumberOfPointsPerHour(
        trajectoryTimes.workStartDate,
        trajectoryTimes.workEndDate
      )
    )
  )
  const trajectoryWorkToHome = addTimestampsForTrajectory(
    trajectoryTimes.workEndDate,
    trajectoryTimes.homeAfterWorkStartDate,
    testBase.workToHomeTrajectory
  )
  const trajectoryAfterWorkTemporallySparse = addTimestampsForTrajectory(
    trajectoryTimes.homeAfterWorkStartDate,
    trajectoryTimes.homeAfterWorkEndDate,
    createCluster(
      testBase.homeTrajectory,
      computeNumberOfPointsPerHour(
        trajectoryTimes.homeAfterWorkStartDate,
        trajectoryTimes.homeAfterWorkEndDate
      )
    )
  )
  const trajectoryTemporallySparse = combineTrajectories(
    {
      id: testDataNames.temporallySparse,
      placename: testDataNames.temporallySparse,
      type: TrajectoryType.EXAMPLE,
    },
    [
      trajectoryHomeTemporallySparse,
      trajectoryHomeToWork,
      trajectoryWorkTemporallySparse,
      trajectoryWorkToHome,
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
  const spatiallyDenseMinRadius = 1
  const spatiallyDenseMaxRadius = 20
  const clusterPointsPerMinute = 0.1
  const trajectoryHomeSpatiallyDense = addTimestampsForTrajectory(
    trajectoryTimes.homeStartDate,
    trajectoryTimes.homeEndDate,
    createCluster(
      testBase.homeTrajectory,
      computeNumberOfPointsPerMinute(
        trajectoryTimes.homeStartDate,
        trajectoryTimes.homeEndDate,
        clusterPointsPerMinute
      ),
      spatiallyDenseMinRadius,
      spatiallyDenseMaxRadius
    )
  )
  const trajectoryHomeToWorkSpatiallyDense = addTimestampsForTrajectory(
    trajectoryTimes.homeEndDate,
    trajectoryTimes.workStartDate,
    testBase.workToHomeTrajectory
  )
  const trajectoryWorkSpatiallyDense = addTimestampsForTrajectory(
    trajectoryTimes.workStartDate,
    trajectoryTimes.workEndDate,
    createCluster(
      testBase.workTrajectory,
      computeNumberOfPointsPerMinute(
        trajectoryTimes.workStartDate,
        trajectoryTimes.workEndDate,
        clusterPointsPerMinute
      ),
      spatiallyDenseMinRadius,
      spatiallyDenseMaxRadius
    )
  )
  const trajectoryWorkToHomeSpatiallyDense = addTimestampsForTrajectory(
    trajectoryTimes.workEndDate,
    trajectoryTimes.homeAfterWorkStartDate,
    testBase.workToHomeTrajectory
  )
  const trajectoryAfterWorkSpatiallyDense = addTimestampsForTrajectory(
    trajectoryTimes.homeAfterWorkStartDate,
    trajectoryTimes.homeAfterWorkEndDate,
    createCluster(
      testBase.homeTrajectory,
      computeNumberOfPointsPerMinute(
        trajectoryTimes.homeAfterWorkStartDate,
        trajectoryTimes.homeAfterWorkEndDate,
        clusterPointsPerMinute
      ),
      spatiallyDenseMinRadius,
      spatiallyDenseMaxRadius
    )
  )
  const trajectorySpatiallyDense = combineTrajectories(
    {
      id: testDataNames.spatiallyDense,
      placename: testDataNames.spatiallyDense,
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
    createHomeWorkTrajectory(trajectoryTestBase),
    createTemporallySparseTrajectory(trajectoryTestBase),
    createSpatiallyDenseTrajectory(trajectoryTestBase),
  ]

  exportTrajectories.forEach((trajectory) => {
    TestTrajectoryIO.exportToJson(trajectory)
    if (isGpxExportEnabled) TestTrajectoryIO.exportToGpx(trajectory)
    if (isCsvExportEnabled) TestTrajectoryIO.exportToCsv(trajectory)
  })

  TestTrajectoryIO.logGeneratedTestFiles()
}

main().catch((err) => console.error(err))
