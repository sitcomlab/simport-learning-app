import { Component, Input, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { ModalController } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'
import { DiaryService } from 'src/app/shared-services/diary/diary.service'

@Component({
  selector: 'app-diary-edit',
  templateUrl: './diary-edit.component.html',
  styleUrls: ['./diary-edit.component.scss'],
})
export class DiaryEditComponent implements OnInit {
  id: string
  date: string
  content: string

  // whether the component is presented as a modal
  @Input() isModal = false

  // ion-textarea autogrow bug
  // https://github.com/ionic-team/ionic-framework/issues/21242#issuecomment-752595937
  loaded = false

  constructor(
    private diaryService: DiaryService,
    private router: Router,
    private route: ActivatedRoute,
    private modalController: ModalController,
    private translateService: TranslateService
  ) {}

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')

    if (this.id && this.id !== 'new') {
      const entry = await this.diaryService.getDiaryEntry(this.id)
      this.date = entry.date.toISOString()
      this.content = entry.content
    } else {
      this.date = new Date().toISOString()
    }

    // ion-textarea autogrow bug
    // https://github.com/ionic-team/ionic-framework/issues/21242#issuecomment-752595937
    setTimeout(() => {
      this.loaded = true
    }, 100)
  }

  async saveEntry() {
    try {
      if (this.isModal || this.id === 'new') {
        await this.diaryService.createDiaryEntry(
          new Date(this.date),
          this.content
        )
      } else {
        await this.diaryService.updateDiaryEntry(
          this.id,
          new Date(this.date),
          this.content
        )
      }

      if (this.isModal) {
        this.modalController.dismiss()
      } else {
        this.router.navigate([`/diary`])
      }
    } catch (e) {
      console.log(e)
    }
  }

  getLocale(): string {
    return this.translateService.currentLang
  }

  changeDate(event: Event) {
    this.date = (event.target as HTMLInputElement).value
  }

  dismiss() {
    if (this.isModal) {
      this.modalController.dismiss()
    }
  }
}
