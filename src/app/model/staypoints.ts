export interface StayPointData {
  coordinates: [number, number][]
  starttimes: Date[]
  endtimes: Date[]
}

export interface StayPoints extends StayPointData {
  trajID: string
}

export interface StayPointCluster {
  trajID: string
  coordinates: [number, number]
  onSiteTimes: [Date, Date][]
  componentCoordinates: [number, number][]
}

declare var require: any
export function writeStaypointsToGeoJSON(sp: StayPoints, path: string) {
  const geojson = {
    name: 'StayPoints',
    type: 'FeatureCollection',
    features: [],
    properties: {
      trajID: sp.trajID,
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
  const data = JSON.stringify(geojson)
  const fs = require('fs')
  fs.writeFile(path, data, (err) => {
    if (err) {
      console.log(err)
    }
  })
}

export function writeStaypointClusterArrayToGeoJSON(
  stayPointClusters: StayPointCluster[],
  path: string
) {
  if (stayPointClusters.length === 0) {
    console.log('Cannot write GeoJSON from empty staypoint clusters')
    return
  }
  const geojson = {
    name: 'StayPointClusters',
    type: 'FeatureCollection',
    features: [],
    properties: {
      trajID: stayPointClusters[0].trajID,
    },
  }
  for (const stayPointCluster of stayPointClusters) {
    geojson.features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          stayPointCluster.coordinates[1],
          stayPointCluster.coordinates[0],
        ],
      },
      properties: {
        onSiteTimes: stayPointCluster.onSiteTimes,
      },
    })
  }
  const data = JSON.stringify(geojson)
  const fs = require('fs')
  fs.writeFile(path, data, (err) => {
    if (err) {
      console.log(err)
    }
  })
}
