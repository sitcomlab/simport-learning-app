/* eslint-disable @typescript-eslint/naming-convention */

import * as polyline from '@mapbox/polyline'
import { differenceInDays } from 'date-fns'

export enum TrajectoryType {
  EXAMPLE = 'example',
  IMPORT = 'import',
  USERTRACK = 'track',
}

export enum PointState {
  START = 'start',
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
  speed?: number[]
  state?: PointState[]
}

export interface Point {
  latLng: [number, number]
  time?: Date
  accuracy?: number // in meters
  speed?: number // in meters per second
  state?: PointState
}

export class Trajectory implements TrajectoryMeta, TrajectoryData {
  static trackingTrajectoryID = 'user'

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
      return differenceInDays(ts[0], ts[ts.length - 1])
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
  get speed() {
    return this.data?.speed || []
  }
  get state() {
    return this.data?.state || []
  }

  // Decodes a trajectory that was encoded for assets/trajectories/ via
  // dev/import_example_trajectory.ts
  static fromJSON({
    coordinates,
    timestamps,
    accuracy,
    speed,
    state,
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
      accuracy: accuracy || [],
      speed: speed || [],
      state: (state as PointState[]) || [],
    }
  }

  static toJSON(trajectory: Trajectory): TrajectoryJSON {
    const timestamps = trajectory.timestamps.reduce<number[]>(
      (ts, t, i, dates) => {
        // we don't store a first value, but only following deltas
        if (i === 0) return []
        const date1 = dates[i - 1].getTime() / 1000
        const date2 = dates[i].getTime() / 1000
        ts.push(date2 - date1)
        return ts
      },
      []
    )
    const time0 = trajectory.timestamps[0].toISOString()
    const timeN =
      trajectory.timestamps.length > 1
        ? trajectory.timestamps[trajectory.timestamps.length - 1].toISOString()
        : null
    const trajectoryJson: TrajectoryJSON = {
      coordinates: polyline.encode(trajectory.coordinates),
      timestamps,
      accuracy: trajectory.accuracy || [],
      speed: trajectory.speed || [],
      state: trajectory.state || [],
      time0,
      timeN,
    }
    return trajectoryJson
  }

  addPoint({ latLng, time, accuracy, speed, state }: Point) {
    if (this.data == null)
      this.data = {
        coordinates: [],
        timestamps: [],
        accuracy: [],
        speed: [],
        state: [],
      }
    this.data.coordinates.push(latLng)
    this.data.accuracy.push(accuracy)
    this.data.timestamps.push(time || new Date())
    this.data.speed.push(speed)
    this.data.state.push(state)
  }

  getCopy(): Trajectory {
    const data: TrajectoryData = {
      coordinates: [...this.data?.coordinates],
      timestamps: [...this.data?.timestamps],
      accuracy: [...(this.data?.accuracy || [])],
      speed: [...(this.data?.speed || [])],
      state: [...(this.data?.state || [])],
    }
    return new Trajectory({ ...this.meta }, data)
  }
}

type TrajectoryJSON = {
  coordinates: string // polyline6 encoded
  timestamps: number[]
  speed?: number[]
  accuracy?: number[]
  state?: string[]
  time0: string // isodates
  timeN?: string
}
