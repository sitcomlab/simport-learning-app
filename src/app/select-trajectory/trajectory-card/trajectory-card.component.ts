import { Component, Input, OnInit } from '@angular/core'
import { ModalController, AlertController } from '@ionic/angular'
import * as moment from 'moment'
import { TrajectoryMeta } from 'src/app/model/trajectory'
import { TrajectoryService } from 'src/app/shared-services/trajectory.service'

@Component({
  selector: 'app-trajectory-card',
  templateUrl: './trajectory-card.component.html',
  styleUrls: ['./trajectory-card.component.scss'],
})
export class TrajectoryCardComponent implements OnInit {
  @Input() trajectory: TrajectoryMeta

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private trajectoryService: TrajectoryService
  ) {}

  ngOnInit() {}

  durationString() {
    const days = this.trajectory.durationDays
    return days ? moment.duration(days, 'days').humanize() : '—'
  }

  async deleteTrajectory(e: Event) {
    const alert = await this.alertCtrl.create({
      cssClass: 'my-custom-class',
      header: `Delete ${this.trajectory.placename}`,
      message: 'Are you sure you want to delete the trajectory?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          cssClass: 'danger',
          handler: async () => {
            await this.trajectoryService.deleteTrajectory(this.trajectory)
            this.modalCtrl.dismiss()
          },
        },
      ],
    })

    await alert.present()
  }

  selectTrajectory() {
    this.modalCtrl.dismiss(this.trajectory)
  }
}
