const USAGE =
  'ngx ts-node -r tsconfig-paths/register --dir dev/clustering-experiments detect-staypoints.ts'

import clustering from 'density-clustering'
import haversine from 'haversine-distance'
import { Trajectory, TrajectoryData } from 'src/app/model/trajectory'
//run dev/generate_test_trajectory.ts if this json is empty
import trajectoryFileHomeWork from 'src/app/shared-services/inferences/test-data/test-home-work.json'

/*
TODO to what degree can we assume correctness of input trajectory? currently assuming
    - length of coordinates and timestamps is the same
    - dates are in ascending order
    - there are no missing values
*/

export type StayPoints = {
  coordinates: [number, number][]
  starttimes: Date[]
  endtimes: Date[]
  distTreshMeters: number
  timeThreshMinutes: number
}

function writeStaypointsToGeoJSON(sp: StayPoints, path: string) {
  var geojson = {
    name: 'StayPoints',
    type: 'FeatureCollection',
    features: [],
    properties: {
      distTreshMeters: sp.distTreshMeters,
      timeThreshMinutes: sp.timeThreshMinutes,
    },
  }

  for (let i = 0; i < sp.coordinates.length; i++) {
    geojson.features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [sp.coordinates[i][1], sp.coordinates[i][0]],
      },
      properties: {
        starttime: sp.starttimes[i],
        endtime: sp.endtimes[i],
      },
    })
  }
  var data = JSON.stringify(geojson)
  const fs = require('fs')
  fs.writeFile(path, data, function (err) {
    if (err) {
      console.log(err)
    }
  })
}

/**
 * compute staypoints from trajectory, based on Li et al 2008, "Mining User Similarity Based on Location History"
 * @param  {TrajectoryData} traj The input trajectory
 * @param  {number} distThreshMeters the max spatial radius in meters within which points can be clustered into a staypoint
 * @param  {number} timeThreshMinutes we need to spend more than this amount of minutes within distThreshMeters so that it is considered a staypoint
 * @return {staypoints} the identified staypoints
 */
export function detectStayPoints(
  traj: TrajectoryData,
  distThreshMeters: number,
  timeThreshMinutes: number
): StayPoints {
  if (traj.coordinates.length !== traj.timestamps.length) {
    throw 'Coordinate and timestamp array must be of same length'
  }
  let coords = traj.coordinates
  let times = traj.timestamps
  let length = coords.length
  let i = 0 // i (index into coords) is the current candidate for staypoint
  let j = 0 // j (index into coords) is the next point we compare to i to see whether we left the staypoint
  let dist
  let timeDelta
  let staypoints: StayPoints = {
    coordinates: [],
    starttimes: [],
    endtimes: [],
    distTreshMeters: distThreshMeters,
    timeThreshMinutes: timeThreshMinutes,
  }
  while (i < length && j < length) {
    j = i + 1
    while (j < length) {
      dist = computeHaversineDistance(coords[i], coords[j])
      // if j is within distance of i, it is part of this potential staypoint...
      if (dist > distThreshMeters) {
        // .. if it is further away, we have left i
        timeDelta = getTimeDeltaMinutes(times[i], times[j])
        if (timeDelta > timeThreshMinutes) {
          // we only log i to (j-1) as a staypoint if we spent more than threshold there
          staypoints.coordinates.push(computeMeanCoords(coords.slice(i, j)))
          staypoints.starttimes.push(times[i])
          staypoints.endtimes.push(times[j])
          //console.log('added staypoint from index', i, 'to', j - 1)
        }
        i = j
        break
      }
      j += 1
    }
  }
  //If we spent a lot of time near the last i, we add it as staypoint even though we never left it
  // but only if i isnt the last point anyways
  if (i != length - 1) {
    j = j - 1
    timeDelta = getTimeDeltaMinutes(times[i], times[j])
    if (timeDelta > timeThreshMinutes) {
      // as opposed to the same part in the loop, here we consider j to be part of the staypoint
      staypoints.coordinates.push(computeMeanCoords(coords.slice(i, j + 1)))
      staypoints.starttimes.push(times[i])
      staypoints.endtimes.push(times[j])
      //console.log('added staypoint from index', i, 'to', j)
    }
  }
  return staypoints
}

// compute arithmetic mean of coords
// this will not work at high latitudes/near dateline (?)
// TODO implement more general solution - turf.JS?
function computeMeanCoords(coords: [number, number][]): [number, number] {
  let meanLat = 0
  let meanLong = 0
  coords.forEach(function (point) {
    meanLat += point[0]
    meanLong += point[1]
  })
  meanLat = meanLat / coords.length
  meanLong = meanLong / coords.length
  return [meanLat, meanLong]
}
// compute approx distance between two coordinates in meters
function computeHaversineDistance(firstCoordinate, secondCoordinate): number {
  const a = { latitude: firstCoordinate[0], longitude: firstCoordinate[1] }
  const b = { latitude: secondCoordinate[0], longitude: secondCoordinate[1] }
  return haversine(a, b)
}
//compute distance in minutes between two dates; returns negative number if second date lies before first
function getTimeDeltaMinutes(firstDate: Date, secondDate: Date): number {
  let diff = (secondDate.getTime() - firstDate.getTime()) / 60000
  return diff
}

const trj = Trajectory.fromJSON(trajectoryFileHomeWork)
/*
console.log(trj.coordinates.length);
trj.coordinates.forEach(function(point, index){
    console.log(index, point);
})
*/
let sp = detectStayPoints(trj, 100, 15)
console.log(sp)
writeStaypointsToGeoJSON(sp, 'staypoints.geojson')
