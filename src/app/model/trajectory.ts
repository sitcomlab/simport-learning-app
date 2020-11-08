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
}

export class Trajectory implements TrajectoryMeta, TrajectoryData {
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
      return t1.diff(t2, 'days')
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

  get durationString() {
    return moment.duration(this.durationDays, 'days').humanize()
  }

  get points(): [number, number, Date][] {
    const points = []
    const n = this.data?.coordinates.length || 0
    for (let i = 0; i < n; i++) {
      points.push([...this.data.coordinates[i], this.data.timestamps[i]])
    }
    return points
  }

  addPoint(latLng: [number, number], time?: Date) {
    this.coordinates.push(latLng)
    this.timestamps.push(time || new Date())
  }
}
