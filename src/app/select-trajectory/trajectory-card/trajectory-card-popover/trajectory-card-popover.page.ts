import { Component, Input, OnInit } from '@angular/core'
import {
  ModalController,
  AlertController,
  PopoverController,
  LoadingController,
  ToastController,
} from '@ionic/angular'
import { TrajectoryMeta } from 'src/app/model/trajectory'
import { TrajectoryImportExportService } from 'src/app/shared-services/trajectory-import-export.service'

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
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private trajectoryImportExportService: TrajectoryImportExportService
  ) {}

  ngOnInit() {}

  exportTrajectory(e: Event) {
    e.stopPropagation()
    this.popoverCtrl.dismiss()
    this.trajectoryImportExportService.exportTrajectory(this.trajectory)
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
            await this.showLoadingDialog('Deleting trajectory...')
            await this.trajectoryImportExportService
              .deleteTrajectory(this.trajectory)
              .then(async () => {
                await this.loadingCtrl.dismiss()
                await this.showToast('Trajectory successfully deleted', false)
              })
              .catch(async () => {
                await this.loadingCtrl.dismiss()
                await this.showToast('Trajectory could not be deleted', true)
              })
            this.modalCtrl.dismiss()
          },
        },
      ],
    })
    await alert.present()
  }

  private async showLoadingDialog(message: string) {
    const loading = await this.loadingCtrl.create({
      message,
      translucent: true,
    })
    await loading.present()
  }

  private async showToast(message: string, isError: boolean) {
    const toast = await this.toastCtrl.create({
      message,
      color: isError ? 'danger' : 'medium',
      duration: 1000,
    })
    toast.present()
  }
}
