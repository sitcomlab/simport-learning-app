import { Injectable } from '@angular/core'
import { v4 as uuid } from 'uuid'
import { DiaryEntry } from 'src/app/model/diary-entry'
import { SqliteService } from '../db/sqlite.service'
import { Platform } from '@ionic/angular'
import {
  FilesystemDirectory,
  FilesystemEncoding,
  Plugins,
} from '@capacitor/core'

const { Filesystem, Share } = Plugins

@Injectable({
  providedIn: 'root',
})
export class DiaryService {
  constructor(private dbService: SqliteService, private platform: Platform) {}

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

  async exportDiary() {
    try {
      const diary = await this.getDiary()
      const fileData = diary
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((d) => {
          return `\n${d.date.toISOString()}\n${d.content}\n`
        })
        .join(`\n===========\n`)

      const fileResult = await Filesystem.writeFile({
        data: fileData,
        path: `SIMPORT_diary_${
          new Date().toISOString().replace(/:/g, '-').split('.')[0]
        }.txt`,
        directory: FilesystemDirectory.ExternalStorage,
        encoding: FilesystemEncoding.UTF8,
      })

      if (this.platform.is('android')) {
        await Share.requestPermissions()
      }

      Share.share({
        title: 'My SIMPORT diary',
        url: fileResult.uri,
      })
    } catch (e) {
      throw new Error(`Could not export diary: ${e}`)
    }
  }
}
