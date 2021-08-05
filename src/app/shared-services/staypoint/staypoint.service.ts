import { Injectable } from '@angular/core'
import { SqliteService } from '../../shared-services/db/sqlite.service'
import haversine from 'haversine-distance'
import { Trajectory, TrajectoryData } from 'src/app/model/trajectory'
import { StayPointData, StayPoints } from 'src/app/model/staypoints'

@Injectable({
  providedIn: 'root',
})
export class StaypointService {
  // for meaning of these two parameters, please see detectStayPoints() documentation
  // if you change one or both, please also update the associated detected staypoints in staypoint.service.spec.ts
  readonly DIST_THRESH_METERS = 100
  readonly TIME_THRESH_MINUTES = 15

  constructor(private db: SqliteService) {}

  /**
   * Return staypoints for trajectoryID saved in database (updates staypoints first)
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
   * Update (or create if nonexistent) staypoints for trajectoryID saved in database by incorporating new trajectory points
   * @param trajectoryID The identifier of the trajectory to which staypoints belong
   * @return Nothing
   */
  async updateStayPoints(trajectoryID: string) {
    const traj: Trajectory = await this.db.getFullTrajectory(trajectoryID)
    const trajData: TrajectoryData = {
      coordinates: traj.coordinates,
      timestamps: traj.timestamps,
    }
    const oldStayPoints: StayPoints = await this.db.getStaypoints(trajectoryID)

    if (
      // no staypoints or of wrong parameters in database -> we process whole trajectory
      oldStayPoints === undefined ||
      oldStayPoints.coordinates.length === 0
    ) {
      const spData = this.detectStayPoints(
        trajData,
        this.DIST_THRESH_METERS,
        this.TIME_THRESH_MINUTES
      )
      const spReturn: StayPoints = {
        trajID: trajectoryID,
        coordinates: spData.coordinates,
        starttimes: spData.starttimes,
        endtimes: spData.endtimes,
      }
      await this.db.upsertStaypoints(trajectoryID, spReturn)
      return
    }

    // else, we only process the points newly added to the trajectory and combine with the existing staypoints
    const recentTrajData = this.getTrajAfterLastStayPoint(
      trajData,
      oldStayPoints
    )
    const newSpData = this.detectStayPoints(
      recentTrajData,
      this.DIST_THRESH_METERS,
      this.TIME_THRESH_MINUTES
    )
    const updatedStaypoints: StayPoints = {
      trajID: trajectoryID,
      // note that we have recomputed the last staypoint
      coordinates: oldStayPoints.coordinates
        .slice(0, -1)
        .concat(newSpData.coordinates),
      starttimes: oldStayPoints.starttimes
        .slice(0, -1)
        .concat(newSpData.starttimes),
      endtimes: oldStayPoints.endtimes.slice(0, -1).concat(newSpData.endtimes),
    }
    await this.db.upsertStaypoints(trajectoryID, updatedStaypoints)
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

  /**
   * compute staypoints from trajectory, based on Li et al 2008, "Mining User Similarity Based on Location History"
   * @param  traj The input trajectory
   * @param  distThreshMeters the max spatial radius in meters within which points can be clustered into a staypoint
   * @param  timeThreshMinutes we need to spend more than this amount of minutes within
   *  distThreshMeters so that it is considered a staypoint
   * @return the identified staypoints
   */
  private detectStayPoints(
    traj: TrajectoryData,
    distThreshMeters: number,
    timeThreshMinutes: number
  ): StayPointData {
    if (traj.coordinates.length !== traj.timestamps.length) {
      throw new Error('Coordinate and timestamp array must be of same length')
    }
    const coords = traj.coordinates
    const times = traj.timestamps
    const length = coords.length
    let i = 0 // i (index into coords) is the current candidate for staypoint
    let j = 0 // j (index into coords) is the next point we compare to i to see whether we left the staypoint
    let dist
    let timeDelta
    const staypoints: StayPointData = {
      coordinates: [],
      starttimes: [],
      endtimes: [],
    }
    while (i < length && j < length) {
      j = i + 1
      while (j < length) {
        dist = this.computeHaversineDistance(coords[i], coords[j])
        // if j is within distance of i, it is part of this potential staypoint...
        if (dist > distThreshMeters) {
          // .. if it is further away, we have left i
          timeDelta = this.getTimeDeltaMinutes(times[i], times[j])
          if (timeDelta > timeThreshMinutes) {
            // we only log i to (j-1) as a staypoint if we spent more than threshold there
            staypoints.coordinates.push(
              this.computeMeanCoords(coords.slice(i, j))
            )
            staypoints.starttimes.push(times[i])
            // end of staypoint is start of first moving point
            staypoints.endtimes.push(times[j])
            // console.log('added staypoint from index', i, 'to', j - 1)
          }
          i = j
          break
        }
        j += 1
      }
    }
    // If we spent a lot of time near the last i, we add it as staypoint even though we never left it
    // but only if i isnt the last point anyways
    if (i !== length - 1) {
      j = j - 1
      timeDelta = this.getTimeDeltaMinutes(times[i], times[j])
      if (timeDelta > timeThreshMinutes) {
        // as opposed to the same part in the loop, here we consider j to be part of the staypoint
        staypoints.coordinates.push(
          this.computeMeanCoords(coords.slice(i, j + 1))
        )
        staypoints.starttimes.push(times[i])
        staypoints.endtimes.push(times[j])
        // console.log('added staypoint from index', i, 'to', j)
      }
    }
    return staypoints
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

  // compute approx distance between two coordinates in meters
  private computeHaversineDistance(firstCoordinate, secondCoordinate): number {
    const a = { latitude: firstCoordinate[0], longitude: firstCoordinate[1] }
    const b = { latitude: secondCoordinate[0], longitude: secondCoordinate[1] }
    return haversine(a, b)
  }
  // compute distance in minutes between two dates; returns negative number if second date lies before first
  private getTimeDeltaMinutes(firstDate: Date, secondDate: Date): number {
    const diff = (secondDate.getTime() - firstDate.getTime()) / 60000
    return diff
  }
}
