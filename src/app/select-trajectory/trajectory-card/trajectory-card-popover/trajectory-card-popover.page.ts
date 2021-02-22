import { Component, Input, OnInit } from '@angular/core'
import {
  ModalController,
  AlertController,
  PopoverController,
  ToastController,
} from '@ionic/angular'
import { SocialSharing } from '@ionic-native/social-sharing/ngx'
import { Trajectory, TrajectoryMeta } from 'src/app/model/trajectory'
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
    private toastCtrl: ToastController,
    private trajectoryService: TrajectoryService,
    private socialSharing: SocialSharing
  ) {}

  ngOnInit() {}

  /**
   * TODO: this works fine for iOS, Android may need adjustments
   * @param t trajectory to share
   */
  private shareTrajectory(t: Trajectory) {
    const trajectoryJson = Trajectory.toJSON(t)
    const trajectoryBase64 = btoa(JSON.stringify(trajectoryJson))
    const fileName = t.placename.length > 0 ? t.placename : 'trajectory'
    const sharingOptions = {
      files: [
        `df:${fileName}.json;data:application/json;base64,${trajectoryBase64}`,
      ],
      chooserTitle: 'Exporting trajectory', // android-only dialog-title
    }
    this.socialSharing
      .shareWithOptions(sharingOptions)
      .then(async (result: { completed: boolean; app: string }) => {
        if (result.completed) {
          await this.showToast('Trajectory export successful', false)
        }
      })
      .catch(async () => {
        await this.showToast('Trajectory export failed', true)
      })
  }

  private async showToast(message: string, isError: boolean) {
    const toast = await this.toastCtrl.create({
      message,
      color: isError ? 'danger' : 'medium',
      duration: 1000,
    })
    toast.present()
  }

  exportTrajectory(e: Event) {
    e.stopPropagation()
    this.popoverCtrl.dismiss()
    this.trajectoryService
      .getOne(this.trajectory.type, this.trajectory.id)
      .subscribe((t) => {
        this.shareTrajectory(t)
      })
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
