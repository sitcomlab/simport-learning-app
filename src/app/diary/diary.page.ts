import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { ToastController } from '@ionic/angular'
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
    private toastController: ToastController
  ) {}

  ngOnInit() {}

  async ionViewWillEnter() {
    this.diary = await this.diaryService.getDiary()
  }

  async exportDiary() {
    try {
      await this.diaryService.exportDiary()
    } catch (e) {
      const toast = await this.toastController.create({
        message: e,
        color: 'danger',
        duration: 2000,
      })
      await toast.present()
    }
  }

  navigateDetail(id: string) {
    this.router.navigate([`/diary/${id}`])
  }

  createEntry() {
    this.router.navigate([`/diary/edit/new`])
  }
}
