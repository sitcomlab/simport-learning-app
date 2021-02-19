import { Component, Input, OnInit } from '@angular/core'
import {
  ModalController,
  AlertController,
  PopoverController,
} from '@ionic/angular'
import { TrajectoryMeta } from 'src/app/model/trajectory'
import { TrajectoryService } from 'src/app/shared-services/trajectory.service'

@Component({
  selector: 'app-trajectory-card-popover',
  templateUrl: './trajectory-card-popover.page.html',
  styleUrls: ['./trajectory-card-popover.page.scss'],
})
export class TrajectoryCardPopoverPage implements OnInit {
  @Input() trajectory: TrajectoryMeta

  constructor(
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
    private alertCtrl: AlertController,
    private trajectoryService: TrajectoryService
  ) {}

  ngOnInit() {}

  exportTrajectory(e: Event) {
    e.stopPropagation()
    this.popoverCtrl.dismiss()

    // TODO
  }

  async deleteTrajectory(e: Event) {
    e.stopPropagation()
    this.popoverCtrl.dismiss()
    const alert = await this.alertCtrl.create({
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
}
