import { Point, TrajectoryData } from 'src/app/model/trajectory'
import { IInferenceEngine, InferenceDefinition, InferenceResult } from './types'
import clustering from 'density-clustering'
import haversine from 'haversine-distance'

export class SimpleEngine implements IInferenceEngine {
  infer(
    trajectory: TrajectoryData,
    inferences: InferenceDefinition[]
  ): InferenceResult[] {
    // cluster data
    const result = this.cluster(trajectory)
    // convert cluster of indices to cluster of Point objects
    const pointClusters = this.indexClustersToPointClusters(
      result.clusters,
      trajectory
    )
    // for each cluster...
    pointClusters.forEach((cluster) => {
      // check all inferences...
      inferences.forEach((inference) => {
        // by applying the scoring functions of the inferences...
        inference.scoringFuncs.forEach((scoringFunction) => {
          // and then actually do sth. that makes sense with the scoring function?
          scoringFunction(cluster)
        })
      })
    })

    return []
  }

  private cluster(trajectory: TrajectoryData) {
    var dbscan = new clustering.DBSCAN()
    // parameters: neighborhood radius, number of points in neighborhood to form a cluster
    var clusters = dbscan.run(
      trajectory.coordinates,
      5,
      3,
      this.computeHaversineDistance
    )

    return { clusters: clusters, noise: dbscan.noise }
  }

  private computeHaversineDistance(firstCoordinate, secondCoordinate): number {
    const a = { latitude: firstCoordinate[0], longitude: firstCoordinate[1] }
    const b = { latitude: secondCoordinate[0], longitude: secondCoordinate[1] }
    return haversine(a, b)
  }

  private indexClustersToPointClusters(
    clusters: [[number]],
    trajectory: TrajectoryData
  ): Point[][] {
    return clusters.map((cluster) => {
      return cluster.map((coordinateIndex) => {
        return {
          latLng: [
            trajectory.coordinates[coordinateIndex][0],
            trajectory.coordinates[coordinateIndex][1],
          ],
          time: trajectory.timestamps[coordinateIndex],
          accuracy: trajectory.accuracy
            ? trajectory.accuracy[coordinateIndex]
            : null,
          speed: trajectory.speed ? trajectory.speed[coordinateIndex] : null,
        }
      })
    })
  }
}
