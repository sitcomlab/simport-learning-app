import { Component, Input, OnInit } from '@angular/core'
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx'
import {
  AlertController,
  LoadingController,
  ModalController,
  PopoverController,
  ToastController,
  Platform,
  ActionSheetController,
} from '@ionic/angular'
import { TrajectoryMeta, TrajectoryType } from 'src/app/model/trajectory'
import { LocationService } from 'src/app/shared-services/location/location.service'
import {
  TrajectoryExportResult,
  TrajectoryImportExportService,
} from 'src/app/shared-services/trajectory/trajectory-import-export.service'

@Component({
  selector: 'app-trajectory-card-popover',
  templateUrl: './trajectory-card-popover.page.html',
  styleUrls: ['./trajectory-card-popover.page.scss'],
})
export class TrajectoryCardPopoverPage implements OnInit {
  @Input() trajectory: TrajectoryMeta

  constructor(
    private platform: Platform,
    private androidPermissions: AndroidPermissions,
    private modalController: ModalController,
    private popoverController: PopoverController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private locationService: LocationService,
    private trajectoryImportExportService: TrajectoryImportExportService
  ) {}

  ngOnInit() {}

  async exportTrajectory(e: Event) {
    e.stopPropagation()
    this.popoverController.dismiss()

    if (this.platform.is('android')) {
      await this.presentExportActionSheet()
    } else {
      await this.showLoadingDialog('Exporting trajectory...')
      await this.trajectoryImportExportService
        .exportTrajectoryViaShareDialog(this.trajectory)
        .then(async (result) => {
          await this.handleExportResult(result)
        })
    }
  }

  private async presentExportActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Export trajectory',
      buttons: [
        {
          text: 'Save to downloads',
          icon: 'save-outline',
          handler: async () => {
            const hasPermission = await this.requestAndroidPermission()
            if (hasPermission) {
              await this.showLoadingDialog('Exporting trajectory...')
              await this.trajectoryImportExportService
                .exportTrajectoryToDownloads(this.trajectory)
                .then(async (result) => {
                  await this.handleExportResult(result)
                })
            } else {
              await this.showToast(
                'Trajectory could not be exported as permissions were denied',
                true
              )
            }
          },
        },
        {
          text: 'Share',
          icon: 'share-social-outline',
          handler: async () => {
            await this.showLoadingDialog('Exporting trajectory...')
            await this.trajectoryImportExportService
              .exportTrajectoryViaShareDialog(this.trajectory)
              .then(async (result) => {
                await this.handleExportResult(result)
              })
          },
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
        },
      ],
    })
    await actionSheet.present()
  }

  private async handleExportResult(result: TrajectoryExportResult) {
    await this.hideLoadingDialog()
    if (result.success) {
      await this.showToast('Trajectory successfully exported', false)
    } else {
      await this.showToast(result.errorMessage, true)
    }
  }

  private async requestAndroidPermission(): Promise<boolean> {
    return this.androidPermissions
      .checkPermission(
        this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE
      )
      .then(async (status) => {
        if (status.hasPermission) {
          return true
        } else {
          this.androidPermissions
            .requestPermission(
              this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE
            )
            .then(async (requestStatus) => {
              return requestStatus.hasPermission
            })
        }
      })
  }

  async deleteTrajectory(e: Event) {
    e.stopPropagation()
    this.popoverController.dismiss()
    const alert = await this.alertController.create({
      header: `Delete ${this.trajectory?.placename ?? 'trajectory'}`,
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
            if (this.trajectory.type === TrajectoryType.USERTRACK) {
              this.locationService.stop()
            }
            await this.trajectoryImportExportService
              .deleteTrajectory(this.trajectory)
              .then(async () => {
                await this.hideLoadingDialog()
                await this.showToast('Trajectory successfully deleted', false)
                await this.modalController.dismiss()
              })
              .catch(async () => {
                await this.hideLoadingDialog()
                await this.showToast('Trajectory could not be deleted', true)
              })
          },
        },
      ],
    })
    await alert.present()
  }

  private async showLoadingDialog(message: string) {
    const loading = await this.loadingController.create({
      message,
      translucent: true,
    })
    await loading.present()
  }

  private async hideLoadingDialog() {
    await this.loadingController.dismiss()
  }

  private async showToast(message: string, isError: boolean) {
    const toast = await this.toastController.create({
      message,
      color: isError ? 'danger' : 'success',
      duration: 2000,
    })
    await toast.present()
  }
}
