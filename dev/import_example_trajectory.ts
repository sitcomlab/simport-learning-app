// assumptions:
// - geojson is a feature of polyline with properties.timestamps being an array of iso8601 dates.

const USAGE = `ts-node --dir dev import_example_trajectory.ts <gpx-or-geojson-file> <placename>`

import * as polyline from '@mapbox/polyline'
import * as fs from 'fs'
import * as GPX from 'gpx-parse'
import * as path from 'path'
import { Trajectory, TrajectoryType } from '../src/app/model/trajectory'

function argparse() {
  const args = process.argv.slice(2)
  if (args.length !== 2) {
    console.error(`usage: ${USAGE}`)
    process.exit(1)
  }
  const [filepath, placename] = args
  return { filepath, placename }
}

type Parser = (
  id: string,
  placename: string,
  data: string
) => Promise<Trajectory>

function getParser(extension: string): Parser {
  switch (extension.replace('.', '')) {
    case 'gpx':
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

    case 'geojson':
      return async (id, placename, input) => {
        const json = JSON.parse(input)
        if (json.type !== 'Feature' && json.geometry?.type !== 'Polyline')
          throw new Error('expected GeoJSON Feature<Polyline>')
        if (Array.isArray(json.properties?.timestamps))
          throw new Error('expected timestamps array in properties')

        const meta = { id, placename, type: TrajectoryType.EXAMPLE }
        const data = {
          timestamps: json.properties.timestamps,
          coordinates: json.geometry.coordinates.map(([lon, lat]) => [
            lat,
            lon,
          ]),
        }
        return new Trajectory(meta, data)
      }

    default:
      throw new Error('unsupported format: geojson or gpx expected')
  }
}

// optimize for storage size:
// - coords as with google polyline encoding is almost optimal (apart from further general purpose compression)
// - similarly, we don't store full timestamps, but only the difference between each.
function encodeData(t: Trajectory) {
  const coordinates = polyline.encode(t.coordinates)
  const timestamps = t.timestamps.reduce<number[]>((res, t, i, ts) => {
    if (i === 0) return res
    const t1 = new Date(ts[i - 1])
    const t2 = new Date(ts[i])
    const seconds = Math.round((+t2 - +t1) / 1000)
    res.push(seconds)
    return res
  }, [])

  return JSON.stringify({
    coordinates,
    timestamps,
    time0: t.timestamps[0],
    timeN: t.timestamps[t.timestamps.length - 1],
  })
}

function addToExamples(t: Trajectory) {
  const dir = path.resolve(__dirname, '../src/assets/trajectories')
  const indexPath = `${dir}/index.json`

  const index = JSON.parse(fs.readFileSync(indexPath, { encoding: 'utf-8' }))
  const { id, placename, type, durationDays } = t
  index.push({ id, type, placename, durationDays })
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2))

  fs.writeFileSync(`${dir}/${t.id}.json`, encodeData(t))
}

async function main() {
  const { filepath, placename } = argparse()
  const ext = path.extname(filepath)
  // IDEA: try to parse filepath as url and GET url in that case
  const id = path.basename(filepath, ext)
  const content = fs.readFileSync(filepath, { encoding: 'utf-8' })
  const parser = getParser(ext)
  const traj = await parser(id, placename, content)

  addToExamples(traj)
}

main().catch((err) => console.error(err))
