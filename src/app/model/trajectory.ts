import * as polyline from '@mapbox/polyline'
import * as moment from 'moment'

export enum TrajectoryType {
  EXAMPLE = 'example',
  IMPORT = 'import',
  USERTRACK = 'track',
}

export interface TrajectoryMeta {
  id: string
  type: TrajectoryType
  placename: string
  durationDays?: number
}

export interface TrajectoryData {
  coordinates: [number, number][]
  timestamps: Date[]
  accuracy?: number[]
}

export interface Point {
  latLng: [number, number]
  time?: Date
  accuracy?: number
}

export class Trajectory implements TrajectoryMeta, TrajectoryData {
  // Decodes a trajectory that was encoded for assets/trajectories/ via
  // dev/import_example_trajectory.ts
  static fromJSON({
    coordinates,
    timestamps,
    time0,
  }: TrajectoryJSON): TrajectoryData {
    return {
      coordinates: polyline.decode(coordinates) as [number, number][],
      timestamps: timestamps.reduce<Date[]>((ts, t, i, deltas) => {
        // The array from the JSON has one element less than locations,
        // as it contains time deltas. To restore absolute dates, we add
        // the first timestamp & in the same iteration also add the first delta
        if (i === 0) ts.push(new Date(time0))
        const t1 = ts[i]
        const deltaMs = deltas[i] * 1000
        ts.push(new Date(t1.getTime() + deltaMs))
        return ts
      }, []),
    }
  }

  constructor(private meta: TrajectoryMeta, private data?: TrajectoryData) {
    if (data?.coordinates.length !== data?.timestamps.length)
      throw new Error(
        `data corruption; coordinates & timestamps don\'t have equal length`
      )
  }

  // implement TrajectoryMeta interface
  get id() {
    return this.meta.id
  }
  get type() {
    return this.meta.type
  }
  get placename() {
    return this.meta.placename
  }
  get durationDays() {
    // try to compute durationDays for precision
    const ts = this.data?.timestamps
    if (ts?.length) {
      const t1 = moment(ts[0])
      const t2 = moment(ts[ts.length - 1])
      return t2.diff(t1, 'days', true)
    }
    // fall back to stored value
    return this.meta.durationDays || 0
  }

  // implement TrajectoryData interface
  get coordinates() {
    return this.data?.coordinates || []
  }
  get timestamps() {
    return this.data?.timestamps || []
  }
  get accuracy() {
    return this.data?.accuracy || []
  }

  addPoint({ latLng, time, accuracy }: Point) {
    this.data.coordinates.push(latLng)
    this.data.accuracy.push(accuracy)
    this.data.timestamps.push(time || new Date())
  }
}

type TrajectoryJSON = {
  coordinates: string // polyline6 encoded
  timestamps: number[]
  time0: string // isodates
  timeN?: string
}
