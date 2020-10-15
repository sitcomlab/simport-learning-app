// WIP. this should probably be a class, implementing an active record to some DB connection?
export interface Trajectory {
  id: string
  placename: string
  coordinates?: [number, number][]
  timestamps?: Date[]
}
