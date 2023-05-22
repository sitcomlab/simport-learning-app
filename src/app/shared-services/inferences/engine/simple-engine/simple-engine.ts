import { Point, Trajectory } from 'src/app/model/trajectory'
import { Inference } from 'src/app/model/inference'
import {
  IInferenceEngine,
  InferenceDefinition,
  InferenceResult,
  InferenceResultStatus,
} from '../types'
import { NightnessScoring } from '../../scoring/nightness-scoring'
import { IInferenceScoring, InferenceScoringResult } from '../../scoring/types'
import { WorkHoursScoring } from '../../scoring/work-hours-scoring'
import { PointCountScoring } from '../../scoring/pointcount-scoring'

import clustering from 'density-clustering'
import haversine from 'haversine-distance'
import { v4 as uuid } from 'uuid'
import concaveman from 'concaveman'

export class SimpleEngine implements IInferenceEngine {
  scorings: IInferenceScoring[] = [
    new NightnessScoring(),
    new WorkHoursScoring(),
    new PointCountScoring(),
  ]

  private inputCoordinatesLimit = 100000

  async infer(
    trajectory: Trajectory,
    inferences: InferenceDefinition[]
  ): Promise<InferenceResult> {
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

    const inferenceResults: Inference[] = []
    // for each cluster...
    pointClusters.forEach((cluster) => {
      // check all inferences...
      inferences.forEach((inference) => {
        // by applying the scoring functions of the engine...
        const inferenceScores: InferenceScoringResult[] = []
        this.scorings.forEach((scoring) => {
          // and then apply scorings
          const score = scoring.score(cluster, pointClusters)
          inferenceScores.push(score)
        })
        // interpret scorings
        const inferenceResult = this.interpretInferenceScores(
          inference,
          inferenceScores,
          cluster,
          trajectory.id
        )
        if (inferenceResult !== null) {
          inferenceResults.push(inferenceResult)
        }
      })
    })

    return {
      status:
        inferenceResults.length === 0
          ? InferenceResultStatus.noInferencesFound
          : InferenceResultStatus.successful,
      inferences: inferenceResults,
    }
  }

  private interpretInferenceScores(
    inferenceDef: InferenceDefinition,
    scoringResults: InferenceScoringResult[],
    cluster: Point[],
    trajectoryId: string
  ): Inference {
    const confidences: { confidence: number; weight: number }[] = []
    scoringResults.forEach((scoringResult) => {
      const config = inferenceDef.getScoringConfig(scoringResult.type)
      if (config !== null) {
        let inferenceConfidence = config.confidence(scoringResult.value)
        if (isNaN(inferenceConfidence) || inferenceConfidence === undefined) {
          inferenceConfidence = 0
        }
        const scoringConfidence = {
          confidence: inferenceConfidence,
          weight: config.weight,
        }
        confidences.push(scoringConfidence)
      }
    })
    let avgConfidence = 0
    const sumWeights = confidences.reduce((p, c) => p + c.weight, 0)
    if (confidences.length > 0 && sumWeights > 0) {
      avgConfidence =
        confidences.reduce((p, c) => p + c.confidence * c.weight, 0) /
        sumWeights
    }

    const centroid = this.calculateCentroid(cluster)

    const convexHull = concaveman(
      cluster.map((v) => v.latLng),
      Infinity // Infinity: convex hull
    )

    return new Inference(
      uuid(),
      inferenceDef.type,
      inferenceDef.type,
      'TODO: description',
      trajectoryId,
      centroid.centerPoint.latLng,
      convexHull.map((c) => [c[0], c[1]]),
      avgConfidence,
      centroid.maxDistance
    )
  }

  private calculateCentroid(cluster: Point[]): {
    centerPoint: Point
    maxDistance: number
  } {
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

  private cluster(trajectory: Trajectory) {
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

  private computeHaversineDistance(
    firstCoordinate: [number, number],
    secondCoordinate: [number, number]
  ): number {
    const a = { latitude: firstCoordinate[0], longitude: firstCoordinate[1] }
    const b = { latitude: secondCoordinate[0], longitude: secondCoordinate[1] }
    return haversine(a, b)
  }

  private indexClustersToPointClusters(
    clusters: [[number]],
    trajectory: Trajectory
  ): Point[][] {
    return clusters.map((cluster) =>
      cluster.map((coordinateIndex) => ({
        latLng: [
          trajectory.coordinates[coordinateIndex][0],
          trajectory.coordinates[coordinateIndex][1],
        ],
        time: trajectory.timestamps[coordinateIndex],
        accuracy: trajectory.accuracy
          ? trajectory.accuracy[coordinateIndex]
          : null,
        speed: trajectory.speed ? trajectory.speed[coordinateIndex] : null,
      }))
    )
  }
}
