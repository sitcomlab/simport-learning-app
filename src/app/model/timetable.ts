export class TimetableEntry {
  constructor(
    public weekday: number,
    public hour: number,
    public inference: string,
    public count: number
  ) {}

  static fromJSON({ weekday, hour, inference, count }): TimetableEntry {
    return new TimetableEntry(weekday, hour, inference, count)
  }
}
