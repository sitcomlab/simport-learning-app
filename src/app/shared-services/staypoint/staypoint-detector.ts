import { Injectable } from '@angular/core'
import haversine from 'haversine-distance'
import { PointState, TrajectoryData } from 'src/app/model/trajectory'
import { StayPointData } from 'src/app/model/staypoints'

@Injectable({
  providedIn: 'root',
})
export class StaypointDetector {
  /**
   * compute staypoints from trajectory, based on Li et al 2008, "Mining User Similarity Based on Location History"
   * @param  traj The input trajectory
   * @param  distThreshMeters the max spatial radius in meters within which points can be clustered into a staypoint
   * @param  timeThreshMinutes we need to spend more than this amount of minutes within
   *  distThreshMeters so that it is considered a staypoint
   * @return the identified staypoints
   */
  public detectStayPoints(
    traj: TrajectoryData,
    distThreshMeters: number,
    timeThreshMinutes: number
  ): StayPointData {
    if (traj.coordinates.length !== traj.timestamps.length) {
      throw new Error('Coordinate and timestamp array must be of same length')
    }
    // if accuracy is saved, filter out points with accuracy of above 200 m
    const coords = traj.accuracy
      ? traj.accuracy
          .map((acc, index) =>
            acc <= 200 ? traj.coordinates[index] : undefined
          )
          .filter((x) => x)
      : traj.coordinates
    const times = traj.accuracy
      ? traj.accuracy
          .map((acc, index) =>
            acc <= 200 ? traj.timestamps[index] : undefined
          )
          .filter((x) => x)
      : traj.timestamps
    // additional check here so we dont map onto undefined traj.state
    const states = traj.state
      ? traj.accuracy
        ? traj.accuracy
            .map((acc, index) => (acc <= 200 ? traj.state[index] : undefined))
            .filter((x) => x)
        : traj.state
      : undefined
    const length = coords.length
    let i = 0 // i (index into coords) is the current candidate for staypoint
    let j = 0 // j (index into coords) is the next point we compare to i to see whether we left the staypoint
    let dist: number
    let timeDelta: number
    const staypoints: StayPointData = {
      coordinates: [],
      starttimes: [],
      endtimes: [],
    }
    while (i < length && j < length) {
      j = i + 1
      while (j < length) {
        if (states && states[j] === PointState.START) {
          // j is start of trajectory, we check for a staypoint from i to j-1
          if (
            i !== j - 1 &&
            this.getTimeDeltaMinutes(times[i], times[j - 1]) > timeThreshMinutes
          ) {
            staypoints.coordinates.push(
              this.computeMeanCoords(coords.slice(i, j))
            )
            staypoints.starttimes.push(times[i])
            staypoints.endtimes.push(times[j - 1])
          }
          i = j
          break
        }
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
