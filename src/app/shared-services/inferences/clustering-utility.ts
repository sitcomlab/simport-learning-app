import { TrajectoryData } from 'src/app/model/trajectory'
import clustering from 'density-clustering'
import haversine from 'haversine-distance'
import * as fs from 'fs'

export class ClusteringUtility {
  cluster(trajectory: TrajectoryData, saveAsCsv: boolean = false) {
    var dbscan = new clustering.DBSCAN()
    // parameters: 5 - neighborhood radius, 2 - number of points in neighborhood to form a cluster
    var clusters = dbscan.run(
      trajectory.coordinates,
      4,
      4,
      this.computeHaversineDistance
    )
    console.log('Clusters:')
    console.log(clusters)
    console.log('Noise:')
    console.log(dbscan.noise)

    if (saveAsCsv) {
      this.exportToCsv(clusters, dbscan.noise, trajectory, '../test-data/')
    }
  }

  private computeHaversineDistance(firstCoordinate, secondCoordinate): number {
    const a = { latitude: firstCoordinate[0], longitude: firstCoordinate[1] }
    const b = { latitude: secondCoordinate[0], longitude: secondCoordinate[1] }
    return haversine(a, b)
  }

  private exportToCsv(
    clusters: [[number]],
    noise: [number],
    trajectory: TrajectoryData,
    filepath: string,
    filename: string = 'clusters'
  ) {
    // if (!fs.existsSync(filepath)) {
    //   fs.mkdirSync(filepath)
    // }
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

    csvContent += '\n'
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
    console.log(csvContent)
    // const fullpath = `${filepath}${filename}.csv`
    // fs.writeFile(fullpath, csvContent, function (error) {
    //   if (error) return console.log(error)
    // })
  }
}
