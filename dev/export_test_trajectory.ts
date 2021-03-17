import * as fs from 'fs'
import * as path from 'path'
import * as GPX from 'gpx-parse'
import createGpx from 'gps-to-gpx'
import { Trajectory, TrajectoryType } from '../src/app/model/trajectory'

type Parser = (
  id: string,
  placename: string,
  data: string
) => Promise<Trajectory>

type GpxWaypoint = {
  latitude: number
  longitude: number
  time: string
}

export class TestTrajectoryIO {
  /**
   * Import
   */
  static loadFromGpx(filepath: string): Promise<Trajectory> {
    const ext = path.extname(filepath)
    if (ext != '.gpx') throw new Error('unsupported format: gpx expected')

    const id = path.basename(filepath, ext)
    const content = fs.readFileSync(filepath, { encoding: 'utf-8' })
    const parser = this.getParser()
    return parser(id, id, content)
  }

  private static getParser(): Parser {
    return (id, placename, input) => {
      return new Promise((resolve, reject) => {
        GPX.parseGpx(input, (err, parsed) => {
          if (err) return reject(err)
          const coordinates = []
          const timestamps = []
          for (const track of parsed.tracks) {
            for (const waypoints of track.segments) {
              for (const { lat, lon, time } of waypoints) {
                coordinates.push([lat, lon])
                timestamps.push(time)
              }
            }
          }
          const meta = { id, placename, type: TrajectoryType.EXAMPLE }
          const data = { coordinates, timestamps }
          resolve(new Trajectory(meta, data))
        })
      })
    }
  }

  /**
   * Export
   */

  static exportToJson(
    trajectory: Trajectory,
    filepath: string = '../src/app/shared-services/inferences/test-data/'
  ) {
    if (!fs.existsSync(filepath)) {
      fs.mkdirSync(filepath)
    }
    const fullpath = `${filepath}${trajectory.placename}.json`
    fs.writeFile(fullpath, JSON.stringify(trajectory), function (error) {
      if (error) return console.log(error)
    })
  }

  static exportToGpx(
    trajectory: Trajectory,
    filepath: string = '../src/app/shared-services/inferences/test-data/'
  ) {
    if (!fs.existsSync(filepath)) {
      fs.mkdirSync(filepath)
    }
    const waypoints = trajectory.coordinates.reduce<GpxWaypoint[]>(
      (waypoint, c, index, coords) => {
        waypoint.push({
          latitude: coords[index][0],
          longitude: coords[index][1],
          time: trajectory.timestamps[index].toISOString(),
        })
        return waypoint
      },
      []
    )
    const gpx = createGpx(waypoints, {
      activityName: trajectory.placename,
      startTime: trajectory.timestamps[0],
    })
    const fullpath = `${filepath}${trajectory.placename}.gpx`
    fs.writeFile(fullpath, gpx, function (error) {
      if (error) return console.log(error)
    })
  }

  static exportToCsv(
    trajectory: Trajectory,
    filepath: string = '../src/app/shared-services/inferences/test-data/'
  ) {
    if (!fs.existsSync(filepath)) {
      fs.mkdirSync(filepath)
    }
    let csvContent = 'latitude,longitude,timestamp\n'
    csvContent += trajectory.coordinates
      .map((c, i) => {
        return [c[0], c[1], trajectory.timestamps[i]?.toISOString()].join(',')
      })
      .join('\n')
    csvContent += '\n'
    const fullpath = `${filepath}${trajectory.placename}.csv`
    fs.writeFile(fullpath, csvContent, function (error) {
      if (error) return console.log(error)
    })
  }
}
