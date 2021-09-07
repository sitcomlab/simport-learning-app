import { StayPoints } from 'src/app/model/staypoints'
import ownTrajectory from './input/own_trajectory.json'
import { StaypointDetector } from 'src/app/shared-services/staypoint/staypoint-detector'
import { Trajectory } from 'src/app/model/trajectory'
import { StaypointService } from 'src/app/shared-services/staypoint/staypoint.service'
import {
  inferHomeFromStayPointClusters,
  inferWorkFromStayPointClusters,
} from 'src/app/shared-services/staypoint/utils'
import { StaypointClusterer } from 'src/app/shared-services/staypoint/staypoint-clusterer'
import trajectoryFileHomeWork from 'src/app/shared-services/inferences/test-data/test-home-work.json'

// run on unix
// cd ./dev/clustering-experiments
// ts-node -r tsconfig-paths/register ./engine-using-staypoints.ts

// run on non unix
// ts-node -r tsconfig-paths\register .\dev\clustering-experiments\engine-using-staypoints.ts

async function main() {
  const detector = new StaypointDetector()

  const staypointdata = detector.detectStayPoints(
    Trajectory.fromJSON(ownTrajectory),
    //Trajectory.fromJSON(trajectoryFileHomeWork),
    StaypointService.DIST_THRESH_METERS,
    StaypointService.TIME_THRESH_MINUTES
  )
  const staypoints: StayPoints = {
    trajID: 'own_trajectory',
    coordinates: staypointdata.coordinates,
    starttimes: staypointdata.starttimes,
    endtimes: staypointdata.endtimes,
  }
  const clusterer = new StaypointClusterer()
  const stayPointClusters = clusterer.clusterStayPoints(
    staypoints,
    StaypointService.CLUSTERING_NEIGHBORHOOD_RADIUS,
    StaypointService.CLUSTERING_POINTS_IN_NEIGHBORHOOD
  )
  // Note that the second parameter here should be the number of days in trajectory, as implemented in staypoint engine
  const homeInference = inferHomeFromStayPointClusters(stayPointClusters, 100)
  const workInference = inferWorkFromStayPointClusters(stayPointClusters, 100)
  console.log(homeInference)
  console.log(workInference)
}

main().catch((err) => console.error(err))
