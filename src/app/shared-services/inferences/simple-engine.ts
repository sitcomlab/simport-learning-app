import { Point, TrajectoryData } from 'src/app/model/trajectory'
import { Inference } from 'src/app/model/inference'
import {
  IInferenceEngine,
  InferenceDefinition,
  InferenceResult,
  InferenceResultStatus,
} from './types'
import { NightnessScoring } from './scoring/nightness-scoring'
import { IInferenceScoring, InferenceScoringResult } from './scoring/types'
import { WorkHoursScoring } from './scoring/work-hours-scoring'
import { PointCountScoring } from './scoring/pointcount-scoring'

import clustering from 'density-clustering'
import haversine from 'haversine-distance'

export class SimpleEngine implements IInferenceEngine {
  scorings: IInferenceScoring[] = [
    new NightnessScoring(),
    new WorkHoursScoring(),
    new PointCountScoring(),
  ]

  private inputCoordinatesLimit = 100000

  infer(
    trajectory: TrajectoryData,
    inferences: InferenceDefinition[]
  ): InferenceResult {
    if (trajectory.coordinates.length > this.inputCoordinatesLimit) {
      return {
        status: InferenceResultStatus.tooManyCoordinates,
        inferences: [],
      }
    }

    // cluster data
    const result = this.cluster(trajectory)
    // convert cluster of indices to cluster of Point objects
    const pointClusters = this.indexClustersToPointClusters(
      result.clusters,
      trajectory
    )

    const intermediateInferences: Inference[] = []
    // for each cluster...
    pointClusters.forEach((cluster) => {
      // check all inferences...
      inferences.forEach((inference) => {
        // by applying the scoring functions of the engine...
        const inferenceScores: InferenceScoringResult[] = []
        this.scorings.forEach((scoring) => {
          // and then actually do sth. that makes sense with the scoring function?
          const score = scoring.score(cluster, pointClusters)
          inferenceScores.push(score)
        })
        const inferenceResult = this.interpretInferenceScores(
          inference,
          inferenceScores,
          cluster
        )
        if (inferenceResult !== null) {
          intermediateInferences.push(inferenceResult)
        }
      })
    })

    const inferenceResults = this.filterInferenceResults(
      intermediateInferences,
      inferences
    )
    return {
      status: InferenceResultStatus.successful,
      inferences: inferenceResults,
    }
  }

  private interpretInferenceScores(
    inferenceDef: InferenceDefinition,
    scoringResults: InferenceScoringResult[],
    cluster: Point[]
  ): Inference {
    // TODO: create valid InferenceResults
    // this is just a static sample interpretation
    const confidences: { confidence: number; weight: number }[] = []
    scoringResults.forEach((scoringResult) => {
      const config = inferenceDef.getScoringConfig(scoringResult.type)
      if (config !== null) {
        const scoringConfidence = {
          confidence: config.confidence(scoringResult.value),
          weight: config.weight,
        }
        confidences.push(scoringConfidence)
      }
    })
    let confidence = 0
    const weights = confidences.reduce((p, c) => p + c.weight, 0)
    if (confidences.length > 0 && weights > 0) {
      confidence =
        confidences.reduce((p, c) => p + c.confidence * c.weight, 0) / weights
    }
    const centroid = this.calculateCentroid(cluster)
    return {
      name: inferenceDef.type,
      type: inferenceDef.type,
      description: 'TODO',
      trajectoryId: 'TODO',
      lonLat: [centroid.centerPoint.latLng[1], centroid.centerPoint.latLng[0]],
      confidence,
      accuracy: centroid.maxDistance,
    }
  }

  private filterInferenceResults(
    results: Inference[],
    inferenceDefs: InferenceDefinition[]
  ): Inference[] {
    // TODO: prioritze and filter InferenceResults
    return results
  }

  private calculateCentroid(
    cluster: Point[]
  ): { centerPoint: Point; maxDistance: number } {
    // simple sample centroid calulation
    if (cluster.length === 0) {
      return null
    }
    const latLng = cluster.map((p) => p.latLng)
    const centerLat =
      latLng.map((p) => p[0]).reduce((a, b) => a + b) / latLng.length
    const centerLng =
      latLng.map((p) => p[1]).reduce((a, b) => a + b) / latLng.length
    const centerPoint: Point = { latLng: [centerLat, centerLng] }
    const maxDistance = Math.max.apply(
      Math,
      cluster.map((p) =>
        this.computeHaversineDistance(centerPoint.latLng, p.latLng)
      )
    )
    return { centerPoint, maxDistance }
  }

  private cluster(trajectory: TrajectoryData) {
    const dbscan = new clustering.DBSCAN()
    // parameters: neighborhood radius, number of points in neighborhood to form a cluster
    const clusters = dbscan.run(
      trajectory.coordinates,
      11,
      7,
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
