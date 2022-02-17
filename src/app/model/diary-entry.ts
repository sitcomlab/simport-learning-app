export class DiaryEntry {
  constructor(
    public id: string,
    public created: Date,
    public updated: Date,
    public date: Date,
    public content: string
  ) {}

  static abstractLength = 20

  static fromJSON({ id, created, updated, date, content }): DiaryEntry {
    return new DiaryEntry(
      id,
      new Date(created * 1000),
      new Date(updated * 1000),
      new Date(date * 1000),
      content
    )
  }

  get abstract(): string {
    return this.content.length <= DiaryEntry.abstractLength
      ? this.content
      : `${this.content.substring(0, DiaryEntry.abstractLength)}…`
  }
}
