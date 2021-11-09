import { Inference } from './inference'
import { Trajectory } from './trajectory'

export interface Visit {
  inference: Inference
  count: number
  hour: Hour
}

export class Hour {
  constructor(
    public id: string,
    public hour: number,
    public weekdayId: string
  ) {}

  static fromJSON({ id, hour, weekday }): Hour {
    return new Hour(id, hour, weekday)
  }
}

export class Weekday {
  constructor(
    public id: string,
    public weekday: number,
    public trajectoryId: string
  ) {}

  static fromJSON({ id, weekday, trajectory }): Weekday {
    return new Weekday(id, weekday, trajectory)
  }
}
