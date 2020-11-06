export enum TrajectoryType {
  EXAMPLE   = 'example',
  IMPORT    = 'import',
  USERTRACK = 'track',
}

export interface TrajectoryMeta {
  id: string,
  type: TrajectoryType,
  placename: string,
  durationDays?: number,
}

export interface TrajectoryData {
  coordinates: [number, number][],
  timestamps: Date[],
}

export interface Trajectory extends TrajectoryMeta, TrajectoryData { }
