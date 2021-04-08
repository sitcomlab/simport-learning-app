import { Point, TrajectoryData } from 'src/app/model/trajectory'
import {
  IInferenceEngine,
  InferenceDefinition,
  InferenceResult,
  InferenceType,
} from './types'
import clustering from 'density-clustering'
import haversine from 'haversine-distance'
import { NightnessScoring } from './scoring/nightness-scoring'
import {
  IInferenceScoring,
  InferenceScoringResult,
  InferenceScoringType,
} from './scoring/types'

export class SimpleEngine implements IInferenceEngine {
  scorings: IInferenceScoring[] = [new NightnessScoring()]

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

    const intermediateInferenceResults: InferenceResult[] = []
    // for each cluster...
    pointClusters.forEach((cluster) => {
      // check all inferences...
      inferences.forEach((inference) => {
        // by applying the scoring functions of the engine...
        const inferenceScores: InferenceScoringResult[] = []
        this.scorings.forEach((scoring) => {
          // and then actually do sth. that makes sense with the scoring function?
          const score = scoring.score(cluster)
          inferenceScores.push(score)
        })
        const inferenceResult = this.interpretInferenceScores(
          inference,
          inferenceScores,
          cluster
        )
        if (inferenceResult !== null) {
          intermediateInferenceResults.push(inferenceResult)
          if (inferenceResult.confidence || 0 > 0) {
            console.log(inference.info(inferenceResult))
          }
        }
      })
    })

    const inferenceResults = this.filterInferenceResults(
      intermediateInferenceResults
    )

    return inferenceResults
  }

  private interpretInferenceScores(
    inferenceDef: InferenceDefinition,
    scoringResults: InferenceScoringResult[],
    cluster: Point[]
  ): InferenceResult {
    // TODO: create valid InferenceResults
    // this is just a static sample interpretation
    let confidence = 0
    scoringResults
      .filter((s) => s.type === InferenceScoringType.nightness)
      .forEach((scoringResult) => {
        if (
          inferenceDef.type === InferenceType.home &&
          scoringResult.value > 0.55
        ) {
          confidence = 1
        } else if (
          inferenceDef.type === InferenceType.work &&
          scoringResult.value < 0.45
        ) {
          confidence = 1
        }
      })

    const centroid = this.calculateCentroid(cluster)
    return {
      name: 'TODO',
      description: 'TODO',
      trajectoryId: 'TODO',
      lonLat: centroid.latLng,
      confidence,
      accuracy: -1,
    }
  }

  private filterInferenceResults(
    results: InferenceResult[]
  ): InferenceResult[] {
    // TODO: prioritze and filter InferenceResults
    return results
  }

  private calculateCentroid(cluster: Point[]): Point {
    // simple sample centroid calulation
    const latLng = cluster.map((p) => p.latLng)
    if (latLng.length === 0) {
      return null
    }
    const centerLat =
      latLng.map((p) => p[0]).reduce((a, b) => a + b) / latLng.length
    const centerLng =
      latLng.map((p) => p[1]).reduce((a, b) => a + b) / latLng.length
    return { latLng: [centerLat, centerLng] }
  }

  private cluster(trajectory: TrajectoryData) {
    const dbscan = new clustering.DBSCAN()
    // parameters: neighborhood radius, number of points in neighborhood to form a cluster
    const clusters = dbscan.run(
      trajectory.coordinates,
      5,
      3,
      this.computeHaversineDistance
    )

    return { clusters, noise: dbscan.noise }
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
