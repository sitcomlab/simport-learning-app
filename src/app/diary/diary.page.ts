import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { ToastController } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'
import { DiaryEntry } from '../model/diary-entry'
import { DiaryService } from '../shared-services/diary/diary.service'

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
    private translateService: TranslateService
  ) {}

  ngOnInit() {}

  async ionViewWillEnter() {
    this.diary = (await this.diaryService.getDiary()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    )
  }

  async exportDiary() {
    try {
      await this.diaryService.exportDiary()
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
    const locale = this.translateService.getBrowserCultureLang()
    return d.toLocaleDateString(locale)
  }

  navigateDetail(id: string) {
    this.router.navigate([`/diary/${id}`])
  }

  createEntry() {
    this.router.navigate([`/diary/edit/new`])
  }
}
