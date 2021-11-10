export class Visit {
  constructor(
    public weekday: number,
    public hour: string,
    public inference: string,
    public count: number
  ) {}

  static fromJSON({ weekday, hour, inference, count }): Visit {
    return new Visit(weekday, hour, inference, count)
  }
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
