import { Injectable } from '@angular/core'
import { StayPointCluster, StayPoints } from 'src/app/model/staypoints'
import clustering from 'density-clustering'
import haversine from 'haversine-distance'

@Injectable({
  providedIn: 'root',
})
export class StaypointClusterer {
  /**
   * Turn staypoints into cluster of staypoints using dbscan
   * @param  stayPoints The input staypoints.
   * @param  neighborhoodRadius The size of the search radius from a given point within which points are classified as neighbors.
   * @param  pointsInNeighborhood Minimum number of points required to form a neighborhood ('dense region').
   * @return The clusters of staypoints
   */
  public clusterStayPoints(
    stayPoints: StayPoints,
    neighborhoodRadius: number,
    pointsInNeighborhood: number
  ): StayPointCluster[] {
    if (stayPoints.coordinates.length === 0) return undefined
    const clusters = this.applyClustering(
      stayPoints,
      neighborhoodRadius,
      pointsInNeighborhood
    )
    return this.assembleStayPointClusters(stayPoints, clusters)
  }

  // clusters staypoints by spatial proximity
  private applyClustering(
    stayPoints: StayPoints,
    neighborhoodRadius: number,
    pointsInNeighborhood: number
  ): number[][] {
    const dbscan = new clustering.DBSCAN()
    // parameters: neighborhood radius, number of points in neighborhood to form a cluster
    // number of points for cluster set to one as we dont care if outliers get their own cluster
    const clusters = dbscan.run(
      stayPoints.coordinates,
      neighborhoodRadius,
      pointsInNeighborhood,
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
    for (const cluster of clusters) {
      clusterCoordinates = cluster.map((x) => stayPointsFiltered.coordinates[x])
      clusterTimes = cluster.map((x) => {
        return [
          stayPointsFiltered.starttimes[x],
          stayPointsFiltered.endtimes[x],
        ]
      })
      currentCluster = {
        trajID: stayPointsFiltered.trajID,
        coordinates: this.computeMeanCoords(clusterCoordinates),
        onSiteTimes: clusterTimes,
        componentCoordinates: clusterCoordinates,
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
