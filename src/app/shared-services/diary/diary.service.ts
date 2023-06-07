import { Injectable } from '@angular/core'
import { v4 as uuid } from 'uuid'
import { DiaryEntry } from 'src/app/model/diary-entry'
import { SqliteService } from '../db/sqlite.service'
import { TranslateService } from '@ngx-translate/core'
import JSZip from 'jszip'
import { LogfileService } from '../logfile/logfile.service'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

@Injectable({
  providedIn: 'root',
})
export class DiaryService {
  constructor(
    private dbService: SqliteService,
    private translateService: TranslateService,
    private logfileService: LogfileService
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
   * @description Generates a .zip File containing the latest diary and logfile data and exports it via the Capacitor `Share` plugin
   */
  async exportDiary() {
    const diaryData = await this.createDiaryExport()
    const logfileData = await this.logfileService.exportLog()
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
    const zip = new JSZip()

    zip.file(`diary_${timestamp}.csv`, diaryData)
    zip.file(`log_${timestamp}.csv`, logfileData)

    const data = await zip.generateAsync({ type: 'base64' })

    const fileResult = await Filesystem.writeFile({
      data,
      path: `SIMPORT_export_${timestamp}.zip`,
      directory: Directory.Cache, // write in cache as temp folder
      encoding: Encoding.UTF8,
    })

    Share.share({
      title: this.translateService.instant('diary.exportFileName'),
      url: fileResult.uri,
    })
  }

  /**
   * @returns diary as csv string
   */
  private async createDiaryExport(): Promise<string> {
    try {
      const diary = await this.getDiary()
      const diaryHeader = 'userDate,creationDate,changeDate,content\n'
      const diaryData = diary
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((d) => {
          const userDate = d.date.toISOString()
          const creationDate = d.created.toISOString()
          const changeDate = d.updated.toISOString()
          const content = this.getEscapedDiaryContent(d.content)
          return `${userDate},${creationDate},${changeDate},"${content}"`
        })

      return `${diaryHeader}${diaryData.join('\n')}`
    } catch (e) {
      const errorMessage = this.translateService.instant(
        'diary.exportFileErrorTitle',
        { value: e.message }
      )
      throw new Error(errorMessage)
    }
  }

  private getEscapedDiaryContent(content: string): string {
    // replace double-quotes in content with single-quotes
    return (
      content
        // eslint-disable-next-line @typescript-eslint/quotes
        .replace(/\"/g, "'")
        .replace(/\n/g, '	')
    )
  }
}
