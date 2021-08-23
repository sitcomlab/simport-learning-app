import haversine from 'haversine-distance'
import { Inference } from 'src/app/model/inference'
import { StayPoints } from 'src/app/model/staypoints'
import { InferenceType } from 'src/app/shared-services/inferences/engine/types'
import clustering from 'density-clustering'
import ownTrajectory from './input/own_trajectory.json'
import { StaypointDetector } from 'src/app/shared-services/staypoint/staypoint-detector'
import { Trajectory } from 'src/app/model/trajectory'
import { StaypointService } from 'src/app/shared-services/staypoint/staypoint.service'

// run
// cd .\dev\clustering-experiments
// ts-node -r tsconfig-paths\register .\engine-using-staypoints.ts

export interface StayPointsScored extends StayPoints {
  numberOfNights?: number[]
  numberOfWorkdays?: number[]
}

export class EngineUsingStayPoints {
  /**
   * Get the location of the cluster of staypoints where the most nights (12pm to 4am) were spent.
   * @param stayPoints The staypoints from which home location is to be extracted
   * @return A home Inference containing the center (mean) of the most likely home staypoint cluster
   */
  inferHomeFromStayPoints(stayPoints: StayPoints): Inference {
    if (
      stayPoints == undefined ||
      stayPoints.coordinates == undefined ||
      stayPoints.coordinates.length === 0
    )
      return undefined
    const stayPointsScored = this.calculateNightness(stayPoints)
    const clusters = this.clusterStayPoints(stayPointsScored)
    const home = this.getMostLikelyInference(
      stayPointsScored,
      clusters,
      InferenceType.home
    )
    return home
  }

  /**
   * Get the location of the cluster of staypoints where the most workdays were spent.
   * Each interval from 10am to 12am and from 2pm to 4pm on Mon-Fri contained within staypoint is counted.
   * @param stayPoints The staypoints from which work location is to be extracted
   * @return A work Inference containing the center (mean) of the most likely work staypoint cluster
   */
  inferWorkFromStayPoints(stayPoints: StayPoints): Inference {
    if (
      stayPoints == undefined ||
      stayPoints.coordinates == undefined ||
      stayPoints.coordinates.length === 0
    )
      return undefined
    const stayPointsScored = this.calculateWorkdayness(stayPoints)
    const clusters = this.clusterStayPoints(stayPointsScored)
    const work = this.getMostLikelyInference(
      stayPointsScored,
      clusters,
      InferenceType.work
    )
    return work
  }

  // calculate how many periods between 12pm and 4am are fully covered by each staypoint
  private calculateNightness(
    stayPointsScored: StayPointsScored
  ): StayPointsScored {
    stayPointsScored.numberOfNights = new Array(
      stayPointsScored.starttimes.length
    ).fill(0)
    let nightCount: number
    let start: Date, end: Date
    const twentyeighthours = 28 * 60 * 60 * 1000
    for (let i = 0; i < stayPointsScored.starttimes.length; i++) {
      nightCount = 0
      start = new Date(stayPointsScored.starttimes[i].getTime())
      end = new Date(stayPointsScored.endtimes[i].getTime())
      // within every 28 hours, there surely is a period from 12pm to 4am
      // this introduces small error on daylight savings, but seems tolerable
      while (end.getTime() - start.getTime() >= twentyeighthours) {
        nightCount += 1
        start.setDate(start.getDate() + 1)
      }
      // check if remaining period (<28h) covers 12pm to 4am (for this, start must be on day before end)
      if (start.getDate() != end.getDate() && end.getHours() > 4) {
        nightCount += 1
      }
      stayPointsScored.numberOfNights[i] = nightCount
    }
    return stayPointsScored
  }

  //calculate how many workdays (10am to 12am and 2pm to 4pm) are fully covered by each staypoint
  private calculateWorkdayness(
    stayPointsScored: StayPointsScored
  ): StayPointsScored {
    stayPointsScored.numberOfWorkdays = new Array(
      stayPointsScored.starttimes.length
    ).fill(0)
    let workCount: number
    let start: Date, end: Date
    for (let i = 0; i < stayPointsScored.starttimes.length; i++) {
      workCount = 0
      start = new Date(stayPointsScored.starttimes[i].getTime())
      end = new Date(stayPointsScored.endtimes[i].getTime())
      while (start.getTime() < end.getTime()) {
        // due to the possibility of multi-day staypoints, we check each day separately
        if (
          start.getDate() == end.getDate() &&
          start.getMonth() == end.getMonth() &&
          start.getFullYear() == end.getFullYear()
        ) {
          // weekday, we count full workday (morning and afternoon) as 1 points
          if (start.getDay() !== 0 && start.getDay() !== 6) {
            if (start.getHours() <= 10 && end.getHours() >= 12) workCount += 0.5
            if (start.getHours() <= 14 && end.getHours() >= 16) workCount += 0.5
          }
          // else start and end on different days
        } else {
          if (start.getDay() !== 0 && start.getDay() !== 6) {
            // here the staypoint doesnt finish until the next day so we only need to check start
            if (start.getHours() <= 10) workCount += 0.5
            if (start.getHours() <= 14) workCount += 0.5
          }
        }
        // increment to next day shortly after midnight
        start.setDate(start.getDate() + 1)
        start.setHours(0, 0, 1)
      }
      stayPointsScored.numberOfWorkdays[i] = workCount
    }
    return stayPointsScored
  }

  // clusters staypoints by spatial proximity
  private clusterStayPoints(stayPointsScored: StayPointsScored): number[][] {
    const dbscan = new clustering.DBSCAN()
    // parameters: neighborhood radius, number of points in neighborhood to form a cluster
    // number of points for cluster set to one as we dont care if outliers get their own cluster
    const clusters = dbscan.run(
      stayPointsScored.coordinates,
      11,
      1,
      this.computeHaversineDistance
    )
    return clusters
  }

  // for each cluster, calculate workday or night count and return inference for highest cluster
  private getMostLikelyInference(
    stayPointsScored: StayPointsScored,
    clusters: number[][],
    inferenceType: InferenceType
  ): Inference {
    let maxScore = 0
    let currentScore: number
    let maxClusterIndex = -1
    for (let clusterIndex = 0; clusterIndex < clusters.length; clusterIndex++) {
      currentScore = 0
      for (let stayPointIndex of clusters[clusterIndex]) {
        if (inferenceType === InferenceType.home) {
          currentScore += stayPointsScored.numberOfNights[stayPointIndex]
        } else {
          currentScore += stayPointsScored.numberOfWorkdays[stayPointIndex]
        }
      }
      if (currentScore > maxScore) {
        maxScore = currentScore
        maxClusterIndex = clusterIndex
      }
    }
    if (maxClusterIndex === -1) return undefined

    const maxClusterCoords = clusters[maxClusterIndex].map(
      (x) => stayPointsScored.coordinates[x]
    )
    let description: string
    if (inferenceType == InferenceType.home) {
      description =
        'Staypoint cluster where most nights (12pm to 4am) were spent'
    } else {
      description =
        'Staypoint cluster where most workdays (10am to 12am and 2pm to 4pm) were spent'
    }
    return new Inference(
      inferenceType,
      inferenceType,
      description,
      stayPointsScored.trajID,
      this.computeMeanCoords(maxClusterCoords)
    )
  }

  private computeHaversineDistance(
    firstCoordinate: [number, number],
    secondCoordinate: [number, number]
  ): number {
    const a = { latitude: firstCoordinate[0], longitude: firstCoordinate[1] }
    const b = { latitude: secondCoordinate[0], longitude: secondCoordinate[1] }
    return haversine(a, b)
  }

  // compute arithmetic mean of coords
  // TODO implement more general solution (turf.JS?) as this will not work at high latitudes/near dateline
  private computeMeanCoords(coords: [number, number][]): [number, number] {
    let meanLat = 0
    let meanLong = 0
    coords.forEach((point) => {
      meanLat += point[0]
      meanLong += point[1]
    })
    meanLat = meanLat / coords.length
    meanLong = meanLong / coords.length
    return [meanLat, meanLong]
  }
}

async function main() {
  let detector = new StaypointDetector()
  let engine = new EngineUsingStayPoints()

  let staypointdata = detector.detectStayPoints(
    Trajectory.fromJSON(ownTrajectory),
    StaypointService.DIST_THRESH_METERS,
    StaypointService.TIME_THRESH_MINUTES
  )
  let staypoints = {
    trajID: 'own_trajectory',
    coordinates: staypointdata.coordinates,
    starttimes: staypointdata.starttimes,
    endtimes: staypointdata.endtimes,
  }
  let homeInference = engine.inferHomeFromStayPoints(staypoints)
  let workInference = engine.inferWorkFromStayPoints(staypoints)
  console.log(homeInference)
  console.log(workInference)
}

main().catch((err) => console.error(err))
