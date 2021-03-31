const USAGE = 'ts-node -r tsconfig-paths/register run-experiments.ts'

import clustering from 'density-clustering'
import haversine from 'haversine-distance'
import { TrajectoryData } from 'src/app/model/trajectory'
import * as fixtures from 'src/app/shared-services/inferences/simple-engine.spec.fixtures'
import * as fs from 'fs'

function cluster(trajectory: TrajectoryData) {
  var dbscan = new clustering.DBSCAN()
  // parameters: 5 - neighborhood radius, 2 - number of points in neighborhood to form a cluster
  var clusters = dbscan.run(
    trajectory.coordinates,
    5,
    3,
    computeHaversineDistance
  )

  return { clusters: clusters, noise: dbscan.noise }
}

function computeHaversineDistance(firstCoordinate, secondCoordinate): number {
  const a = { latitude: firstCoordinate[0], longitude: firstCoordinate[1] }
  const b = { latitude: secondCoordinate[0], longitude: secondCoordinate[1] }
  return haversine(a, b)
}

function exportToCsv(
  clusters: [[number]],
  noise: [number],
  trajectory: TrajectoryData,
  filepath: string,
  filename: string
) {
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath)
  }
  let csvContent = 'latitude,longitude,timestamp,cluster\n'

  csvContent += clusters
    .map((cluster, clusterIndex) => {
      return cluster
        .map((coordinateIndex, i) => {
          return [
            trajectory.coordinates[coordinateIndex][0],
            trajectory.coordinates[coordinateIndex][1],
            trajectory.timestamps[coordinateIndex]?.toISOString(),
            clusterIndex,
          ].join(',')
        })
        .join('\n')
    })
    .join('\n')

  if (clusters.length >= 1) csvContent += '\n'
  csvContent += noise
    .map((coordinateIndex) => {
      return [
        trajectory.coordinates[coordinateIndex][0],
        trajectory.coordinates[coordinateIndex][1],
        trajectory.timestamps[coordinateIndex]?.toISOString(),
        '-1',
      ].join(',')
    })
    .join('\n')

  csvContent += '\n'
  const fullpath = `${filepath}${filename}.csv`
  fs.writeFile(fullpath, csvContent, function (error) {
    if (error) return console.log(error)
  })
  console.log('Cluster file written to ' + fullpath)
}

function applyClusteringAndSaveToCsv(
  trajectory: TrajectoryData,
  filename: string
) {
  const result = cluster(trajectory)
  exportToCsv(
    result.clusters,
    result.noise,
    trajectory,
    __dirname + '/output/',
    filename
  )
}

async function main() {
  applyClusteringAndSaveToCsv(fixtures.trajectoryHomeWork, 'trajectoryHomeWork')
  applyClusteringAndSaveToCsv(
    fixtures.trajectoryHomeWorkSpatiallyDense,
    'trajectoryHomeWorkSpatiallyDense'
  )
  applyClusteringAndSaveToCsv(
    fixtures.trajectoryHomeWorkTemporallySparse,
    'trajectoryHomeWorkTemporallySparse'
  )
  applyClusteringAndSaveToCsv(
    fixtures.trajectoryMobileOnly,
    'trajectoryMobileOnly'
  )
}

main().catch((err) => console.error(err))
