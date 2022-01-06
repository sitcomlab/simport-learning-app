import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { AlertController } from '@ionic/angular'
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
    public alertController: AlertController
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')
    this.entry = await this.diaryService.getDiaryEntry(id)
  }

  editEntry() {
    this.router.navigate([`/diary/edit/${this.entry.id}`])
  }

  async deleteEntry() {
    const alert = await this.alertController.create({
      header: 'Delete this entry?',
      message: 'Are you sure to delete this entry?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            alert.dismiss()
          },
        },
        {
          text: 'Delete',
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
