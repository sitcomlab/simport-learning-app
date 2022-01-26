import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { AlertController } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'
import { DiaryEntry } from 'src/app/model/diary-entry'
import { DiaryService } from 'src/app/shared-services/diary/diary.service'

@Component({
  selector: 'app-diary-detail',
  templateUrl: './diary-detail.component.html',
  styleUrls: ['./diary-detail.component.scss'],
})
export class DiaryDetailComponent implements OnInit {
  entry: DiaryEntry

  constructor(
    private route: ActivatedRoute,
    private diaryService: DiaryService,
    private router: Router,
    public alertController: AlertController,
    private translateService: TranslateService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')
    this.entry = await this.diaryService.getDiaryEntry(id)
  }

  editEntry() {
    this.router.navigate([`/diary/edit/${this.entry.id}`])
  }

  async deleteEntry() {
    const header = this.translateService.instant('diary.deleteEntryAlertHeader')
    const message = this.translateService.instant(
      'diary.deleteEntryAlertMessage'
    )
    const cancelButton = this.translateService.instant(
      'diary.deleteEntryAlertCancelButton'
    )
    const deleteButton = this.translateService.instant(
      'diary.deleteEntryAlertDeleteButton'
    )
    await this.showDeleteEntryAlert(header, message, cancelButton, deleteButton)
  }

  private async showDeleteEntryAlert(
    header: string,
    message: string,
    cancelString: string,
    deleteString: string
  ) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [
        {
          text: cancelString,
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            alert.dismiss()
          },
        },
        {
          text: deleteString,
          cssClass: 'danger',
          handler: async () => {
            try {
              await this.diaryService.deleteDiaryEntry(this.entry.id)
              this.router.navigate([`/diary`])
            } catch (e) {
              console.log(e)
            }
          },
        },
      ],
    })

    await alert.present()
  }
}
