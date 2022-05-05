import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { Platform, ToastController } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'
import { DiaryEntry } from '../model/diary-entry'
import { DiaryService } from '../shared-services/diary/diary.service'
import { LogfileService } from '../shared-services/logfile/logfile.service'

import { FilesystemDirectory, Plugins } from '@capacitor/core'
const { Filesystem, Share } = Plugins

import JSZip from 'jszip'

@Component({
  selector: 'app-diary',
  templateUrl: './diary.page.html',
  styleUrls: ['./diary.page.scss'],
})
export class DiaryPage implements OnInit {
  diary: DiaryEntry[]

  constructor(
    private router: Router,
    private diaryService: DiaryService,
    private toastController: ToastController,
    private translateService: TranslateService,
    private logfileService: LogfileService,
    private platform: Platform
  ) {}

  ngOnInit() {}

  async ionViewWillEnter() {
    this.diary = (await this.diaryService.getDiary()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    )
  }

  /**
   * @description Generates a .zip File containing the latest diary and logfile data and exports it via the Capacitor `Share` plugin
   */
  async exportDiary() {
    try {
      const diaryData = await this.diaryService.exportDiary()
      const logfileData = await this.logfileService.exportLog()

      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, '-')
        .split('.')[0]

      const zip = new JSZip()
      zip.file(`diary_${timestamp}.csv`, diaryData)
      zip.file(`log_${timestamp}.csv`, logfileData)

      const data = await zip.generateAsync({ type: 'base64' })
      const fileResult = await Filesystem.writeFile({
        data,
        path: `SIMPORT_export_${timestamp}.zip`,
        directory: FilesystemDirectory.ExternalStorage,
      })

      if (this.platform.is('android')) {
        await Share.requestPermissions()
      }

      Share.share({
        title: this.translateService.instant('diary.exportFileName'),
        url: fileResult.uri,
      })
    } catch (e) {
      const toast = await this.toastController.create({
        message: e.message,
        color: 'danger',
        duration: 2000,
      })
      await toast.present()
    }
  }

  getLocalDate(d: Date): string {
    return d.toLocaleDateString('de-DE')
  }

  navigateDetail(id: string) {
    this.router.navigate([`/diary/${id}`])
  }

  createEntry() {
    this.router.navigate([`/diary/edit/new`])
  }
}
