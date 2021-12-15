import { Injectable } from '@angular/core'
import { v4 as uuid } from 'uuid'
import { DiaryEntry } from 'src/app/model/diary-entry'
import { SqliteService } from '../db/sqlite.service'

@Injectable({
  providedIn: 'root',
})
export class DiaryService {
  constructor(private dbService: SqliteService) {}

  async getDiary(): Promise<DiaryEntry[]> {
    return this.dbService.getDiary()
  }

  async getDiaryEntry(id: string): Promise<DiaryEntry> {
    return this.dbService.getDiaryEntry(id)
  }

  async createDiaryEntry(date: Date, content: string): Promise<void> {
    const entry = new DiaryEntry(uuid(), new Date(), new Date(), date, content)
    return this.dbService.upsertDiaryEntry(entry)
  }

  async updateDiaryEntry(
    id: string,
    date: Date,
    content: string
  ): Promise<void> {
    const entry = await this.dbService.getDiaryEntry(id)
    const update = new DiaryEntry(
      entry.id,
      entry.created,
      new Date(),
      date,
      content
    )
    return this.dbService.upsertDiaryEntry(update)
  }

  async deleteDiaryEntry(id: string) {
    return this.dbService.deleteDiaryEntry(id)
  }
}
