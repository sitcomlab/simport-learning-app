export interface StayPointData {
  coordinates: [number, number][]
  starttimes: Date[]
  endtimes: Date[]
}

export interface StayPoints extends StayPointData {
  trajID: string
  distTreshMeters: number
  timeThreshMinutes: number
}
