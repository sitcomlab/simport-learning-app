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
  spcs: StayPointCluster[],
  path: string
) {
  const geojson = {
    name: 'StayPointClusters',
    type: 'FeatureCollection',
    features: [],
    properties: {
      trajID: spcs[0].trajID,
    },
  }
  for (const spc of spcs) {
    geojson.features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [spc.coordinates[1], spc.coordinates[0]],
      },
      properties: {
        onSiteTimes: spc.onSiteTimes,
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
