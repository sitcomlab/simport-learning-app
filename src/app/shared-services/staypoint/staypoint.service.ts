import { Injectable } from '@angular/core'
import { SqliteService } from '../../shared-services/db/sqlite.service'
import {
  Trajectory,
  TrajectoryData,
  TrajectoryType,
} from 'src/app/model/trajectory'
import { StayPointCluster, StayPoints } from 'src/app/model/staypoints'
import { TrajectoryService } from '../trajectory/trajectory.service'
import { take } from 'rxjs/operators'
import { StaypointDetector } from './staypoint-detector'
import { StaypointClusterer } from './staypoint-clusterer'

@Injectable({
  providedIn: 'root',
})
export class StaypointService {
  // for meaning of these two parameters, please see StaypointDetector.detectStayPoints() documentation
  // if you change one or both, please also update the associated detected staypoints in staypoint.service.spec.fixtures.ts
  static readonly DIST_THRESH_METERS = 150
  static readonly TIME_THRESH_MINUTES = 15

  // for meaning of these two parameters, please see StaypointClusterer.clusterStayPoints() documentation
  static readonly CLUSTERING_NEIGHBORHOOD_RADIUS = 11
  static readonly CLUSTERING_POINTS_IN_NEIGHBORHOOD = 3

  constructor(
    private db: SqliteService,
    private trajService: TrajectoryService,
    private staypointDetector: StaypointDetector,
    private staypointClusterer: StaypointClusterer
  ) {}

  /**
   * Return staypoints for trajectoryID saved in database
   * @param trajectoryID The identifier of the trajectory to which staypoints belong
   * @return The staypoints
   */
  async getStayPoints(trajectoryID: string): Promise<StayPoints> {
    const stayPoints: StayPoints = await this.db.getStaypoints(trajectoryID)
    return stayPoints
  }

  /**
   * Delete staypoints for trajectoryID saved in database
   * @param trajectoryID The identifier of the trajectory to which staypoints belong
   * @return Nothing
   */
  async deleteStayPoints(trajectoryID: string) {
    await this.db.deleteStaypoints(trajectoryID)
  }

  /**
   * Update (or create if nonexistent) staypoints for non-example trajectory saved in database by incorporating new trajectory points
   * @param trajectoryType The type of the trajectory to which staypoints belong
   * @param trajectoryId The identifier of the trajectory to which staypoints belong
   * @return Nothing
   */
  async updateStayPoints(trajectoryType: TrajectoryType, trajectoryId: string) {
    // atm we cannot save staypoints for traj of type example due to the foreign key constraint, so we ignore them
    if (trajectoryType === TrajectoryType.EXAMPLE) return

    const traj: Trajectory = await this.trajService
      .getOne(trajectoryType, trajectoryId)
      .pipe(take(1))
      .toPromise()
    const trajData: TrajectoryData = {
      coordinates: traj.coordinates,
      timestamps: traj.timestamps,
    }
    const oldStayPoints: StayPoints = await this.db.getStaypoints(trajectoryId)
    // no staypoints for this id in database -> we process whole trajectory
    if (oldStayPoints === undefined || oldStayPoints.coordinates.length === 0) {
      const spData = this.staypointDetector.detectStayPoints(
        trajData,
        StaypointService.DIST_THRESH_METERS,
        StaypointService.TIME_THRESH_MINUTES
      )
      const spReturn: StayPoints = {
        trajID: trajectoryId,
        coordinates: spData.coordinates,
        starttimes: spData.starttimes,
        endtimes: spData.endtimes,
      }
      await this.db.upsertStaypoints(trajectoryId, spReturn)
      return
    }

    // else, we only process the points newly added to the trajectory and combine with the existing staypoints
    const recentTrajData = this.getTrajAfterLastStayPoint(
      trajData,
      oldStayPoints
    )
    const newSpData = this.staypointDetector.detectStayPoints(
      recentTrajData,
      StaypointService.DIST_THRESH_METERS,
      StaypointService.TIME_THRESH_MINUTES
    )
    const updatedStaypoints: StayPoints = {
      trajID: trajectoryId,
      // note that we have recomputed the last staypoint
      coordinates: oldStayPoints.coordinates
        .slice(0, -1)
        .concat(newSpData.coordinates),
      starttimes: oldStayPoints.starttimes
        .slice(0, -1)
        .concat(newSpData.starttimes),
      endtimes: oldStayPoints.endtimes.slice(0, -1).concat(newSpData.endtimes),
    }
    await this.db.upsertStaypoints(trajectoryId, updatedStaypoints)
  }

  /**
   * Return array of staypoint clusters from given staypoints
   * @param StayPoints The staypoints to cluster.
   * @return An array of staypoint clusters.
   */
  async computeStayPointClusters(
    stayPoints: StayPoints
  ): Promise<StayPointCluster[]> {
    if (stayPoints === undefined || stayPoints.coordinates.length === 0)
      return undefined
    const stayPointClusters = await this.staypointClusterer.clusterStayPoints(
      stayPoints,
      StaypointService.CLUSTERING_NEIGHBORHOOD_RADIUS,
      StaypointService.CLUSTERING_POINTS_IN_NEIGHBORHOOD
    )
    return stayPointClusters
  }

  // return final part of provided trajectory, starting at or after starttime of last of provided staypoints
  private getTrajAfterLastStayPoint(
    traj: TrajectoryData,
    sps: StayPoints
  ): TrajectoryData {
    if (sps.coordinates.length === 0) {
      return traj
    }
    const lastStart = sps.starttimes[sps.starttimes.length - 1]
    const firstIndex = traj.timestamps.findIndex(
      (timestamp) => timestamp >= lastStart
    )
    const cutTraj: TrajectoryData = {
      coordinates: traj.coordinates.slice(firstIndex),
      timestamps: traj.timestamps.slice(firstIndex),
    }
    return cutTraj
  }
}
