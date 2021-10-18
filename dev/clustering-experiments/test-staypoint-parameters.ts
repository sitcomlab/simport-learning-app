import {
  StayPointCluster,
  StayPointData,
  StayPoints,
  writeStaypointClusterArrayToGeoJSON,
  writeStaypointsToGeoJSON,
} from 'src/app/model/staypoints'
import { StaypointDetector } from 'src/app/shared-services/staypoint/staypoint-detector'
import { Trajectory } from 'src/app/model/trajectory'
import { StaypointService } from 'src/app/shared-services/staypoint/staypoint.service'
import { TrajectoryData } from 'src/app/model/trajectory'
import { StaypointClusterer } from 'src/app/shared-services/staypoint/staypoint-clusterer'

import ownTrajectory from './input/own_trajectory.json'

// ts-node -r tsconfig-paths\register .\dev\clustering-experiments\test-parameters.ts

async function tryStayPointDetectionParameters(
  traj: TrajectoryData,
  distThresholds: number[],
  timeThresholds: number[],
  folder: string
) {
  const detector = new StaypointDetector()
  let stayPointData: StayPointData
  let stayPoints: StayPoints
  let output_path: string
  for (const distThresh of distThresholds) {
    for (const timeThresh of timeThresholds) {
      stayPointData = detector.detectStayPoints(traj, distThresh, timeThresh)
      output_path =
        folder +
        'staypoint_dist' +
        distThresh.toString() +
        '_time' +
        timeThresh.toString() +
        '.geojson'
      stayPoints = {
        trajID: 'own_trajectory',
        coordinates: stayPointData.coordinates,
        starttimes: stayPointData.starttimes,
        endtimes: stayPointData.endtimes,
      }
      writeStaypointsToGeoJSON(stayPoints, output_path)
    }
  }
}

async function tryStayPointClusteringParameters(
  staypoints: StayPoints,
  neighborhoodRadiusCandidates: number[],
  pointsInNeighborhoodCandidates: number[],
  folder: string
) {
  const clusterer = new StaypointClusterer()
  let stayPointClusters: StayPointCluster[]
  let output_path: string
  for (const neighborhoodRadius of neighborhoodRadiusCandidates) {
    for (const pointsInNeighborhood of pointsInNeighborhoodCandidates) {
      stayPointClusters = clusterer.clusterStayPoints(
        staypoints,
        neighborhoodRadius,
        pointsInNeighborhood
      )
      console.log(
        `Found ${stayPointClusters.length} staypoint clusters for dbscan parameters neighborhood radius of ${neighborhoodRadius} and points in neighborhood of ${pointsInNeighborhood}`
      )
      output_path =
        folder +
        'staypointclusters_radius' +
        neighborhoodRadius.toString() +
        '_numberPoints' +
        pointsInNeighborhood.toString() +
        '.geojson'
      writeStaypointClusterArrayToGeoJSON(stayPointClusters, output_path)
    }
  }
}

async function main() {
  const trajData = Trajectory.fromJSON(ownTrajectory)

  /**
  tryStayPointDetectionParameters(
    trajData,
    [50, 100, 150, 200],
    [10, 15, 20],
    './dev/clustering-experiments/output/'
  )
  */
  const detector = new StaypointDetector()
  const stayPointData = detector.detectStayPoints(
    trajData,
    StaypointService.DIST_THRESH_METERS,
    StaypointService.TIME_THRESH_MINUTES
  )
  const stayPoints = {
    trajID: 'own_trajectory',
    coordinates: stayPointData.coordinates,
    starttimes: stayPointData.starttimes,
    endtimes: stayPointData.endtimes,
  }

  tryStayPointClusteringParameters(
    stayPoints,
    [11],
    [1, 2, 3, 4],
    './dev/clustering-experiments/output/'
  )
}

main().catch((err) => console.error(err))
