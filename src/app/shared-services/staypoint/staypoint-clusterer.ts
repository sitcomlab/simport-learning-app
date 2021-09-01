import { Injectable } from '@angular/core'
import { StayPointCluster, StayPoints } from 'src/app/model/staypoints'
import clustering from 'density-clustering'
import haversine from 'haversine-distance'

@Injectable({
  providedIn: 'root',
})
export class StaypointClusterer {
  /**
   * Turn staypoints into cluster of staypoints using dbscan, disregarding staypoints with too few observations/time
   * @param  stayPoints The input staypoints.
   * @param  minObervationsPerHour The minimum observations per hour required for a staypoint to be considered in the clustering.
   * E.g. with a value of 1/24, a staypoint with length 24.1 hours is only considered if it has at least 2 observations.
   * This is a temporary measure until we log when gps tracking is active.
   * @return The clusters of staypoints
   */
  public clusterStayPoints(
    stayPoints: StayPoints,
    minObervationsPerHour: number
  ): StayPointCluster[] {
    const stayPointsFiltered = this.dropSparseStaypoints(
      stayPoints,
      minObervationsPerHour
    )
    if (stayPointsFiltered.coordinates.length === 0) return undefined
    const clusters = this.applyClustering(stayPointsFiltered)
    return this.assembleStayPointClusters(stayPointsFiltered, clusters)
  }

  // drop Staypoints that have fewer observations per hour than the threshold
  private dropSparseStaypoints(
    stayPoints: StayPoints,
    minObervationsPerHour
  ): StayPoints {
    const msInOneHour = 60 * 60 * 1000
    // array indicating for each staypoint whether it has more obs per hour than threshold
    const enoughObservations = stayPoints.endtimes.map((value, index) => {
      const lengthInHrs =
        (value.getTime() - stayPoints.starttimes[index].getTime()) / msInOneHour
      const density = stayPoints.observationcount[index] / lengthInHrs
      return density >= minObervationsPerHour
    })
    const stayPointsFiltered: StayPoints = {
      trajID: stayPoints.trajID,
      coordinates: stayPoints.coordinates.filter(
        (value, index) => enoughObservations[index]
      ),
      starttimes: stayPoints.starttimes.filter(
        (value, index) => enoughObservations[index]
      ),
      endtimes: stayPoints.endtimes.filter(
        (value, index) => enoughObservations[index]
      ),
      observationcount: stayPoints.observationcount.filter(
        (value, index) => enoughObservations[index]
      ),
    }
    return stayPointsFiltered
  }

  // clusters staypoints by spatial proximity
  private applyClustering(stayPoints: StayPoints): number[][] {
    const dbscan = new clustering.DBSCAN()
    // parameters: neighborhood radius, number of points in neighborhood to form a cluster
    // number of points for cluster set to one as we dont care if outliers get their own cluster
    const clusters = dbscan.run(
      stayPoints.coordinates,
      11,
      1,
      this.computeHaversineDistance
    )
    return clusters
  }

  // fit clusters into staypointcluster datastructure, coords of cluster is mean of members
  private assembleStayPointClusters(
    stayPointsFiltered: StayPoints,
    clusters: number[][]
  ): StayPointCluster[] {
    const stayPointClusters: StayPointCluster[] = []
    let currentCluster: StayPointCluster
    let clusterCoordinates: [number, number][]
    let clusterTimes: [Date, Date][]
    let observationCounts: number[]
    for (const cluster of clusters) {
      clusterCoordinates = cluster.map((x) => stayPointsFiltered.coordinates[x])
      clusterTimes = cluster.map((x) => {
        return [
          stayPointsFiltered.starttimes[x],
          stayPointsFiltered.endtimes[x],
        ]
      })
      observationCounts = cluster.map(
        (x) => stayPointsFiltered.observationcount[x]
      )
      currentCluster = {
        trajID: stayPointsFiltered.trajID,
        coordinates: this.computeMeanCoords(clusterCoordinates),
        onSiteTimes: clusterTimes,
        observationcount: observationCounts.reduce((a, b) => a + b, 0),
      }
      stayPointClusters.push(currentCluster)
    }
    return stayPointClusters
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
