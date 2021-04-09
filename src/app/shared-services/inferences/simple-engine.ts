import { Point, TrajectoryData } from 'src/app/model/trajectory'
import { IInferenceEngine, InferenceDefinition, InferenceResult } from './types'
import { NightnessScoring } from './scoring/nightness-scoring'
import { IInferenceScoring, InferenceScoringResult } from './scoring/types'
import { WorkHoursScoring } from './scoring/work-hours-scoring'
import clustering from 'density-clustering'
import haversine from 'haversine-distance'

export class SimpleEngine implements IInferenceEngine {
  scorings: IInferenceScoring[] = [
    new NightnessScoring(),
    new WorkHoursScoring(),
  ]

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
        }
      })
    })

    const inferenceResults = this.filterInferenceResults(
      intermediateInferenceResults,
      inferences
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
    let confidenceCount = 0
    scoringResults.forEach((scoringResult) => {
      const config = inferenceDef.getScoringConfig(scoringResult.type)
      if (config !== null) {
        if (
          scoringResult.value >= config.range[0] &&
          scoringResult.value <= config.range[1]
        ) {
          confidence += config.confidence(scoringResult.value)
          confidenceCount += 1
        }
      }
    })
    const centroid = this.calculateCentroid(cluster)
    return {
      name: inferenceDef.type,
      type: inferenceDef.type,
      description: 'TODO',
      trajectoryId: 'TODO',
      lonLat: centroid.centerPoint.latLng,
      confidence: confidenceCount > 0 ? confidence / confidenceCount : 0,
      accuracy: centroid.maxDistance,
    }
  }

  private filterInferenceResults(
    results: InferenceResult[],
    inferenceDefs: InferenceDefinition[]
  ): InferenceResult[] {
    // TODO: prioritze and filter InferenceResults
    const filteredResults: InferenceResult[] = results.filter(
      (r) => (r.confidence || 0) >= 0.7
    )
    inferenceDefs.forEach((inferenceDef) => {
      const typedResults = results.filter((r) => r.type === inferenceDef.type)
      // maybe cluster clusters once again to filter really close clusters
    })
    return filteredResults
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
      7,
      5,
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
