import { Injectable } from '@angular/core'
import { v4 as uuid } from 'uuid'
import { DiaryEntry } from 'src/app/model/diary-entry'
import { SqliteService } from '../db/sqlite.service'
import { Platform } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'

@Injectable({
  providedIn: 'root',
})
export class DiaryService {
  constructor(
    private dbService: SqliteService,
    private platform: Platform,
    private translateService: TranslateService
  ) {}

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

  /**
   *
   * @returns diary as csv string
   */
  async exportDiary() {
    try {
      const diary = await this.getDiary()

      const diaryHeader = 'date,content\n'

      const fileData =
        diaryHeader +
        diary
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map((d) => `${d.date.toISOString()},${d.content}\n`)

      return fileData
    } catch (e) {
      const errorMessage = this.translateService.instant(
        'diary.exportFileErrorTitle',
        { value: e.message }
      )
      throw new Error(errorMessage)
    }
  }
}
