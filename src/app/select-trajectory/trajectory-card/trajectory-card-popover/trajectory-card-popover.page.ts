import { Component, Input, OnInit } from '@angular/core'
import {
  AlertController,
  LoadingController,
  ModalController,
  PopoverController,
  ToastController,
} from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'
import { TrajectoryMeta, TrajectoryType } from 'src/app/model/trajectory'
import { FeatureFlagService } from 'src/app/shared-services/feature-flag/feature-flag.service'
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
    private modalController: ModalController,
    private popoverController: PopoverController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private locationService: LocationService,
    private trajectoryImportExportService: TrajectoryImportExportService,
    private translateService: TranslateService,
    private featureFlagService: FeatureFlagService
  ) {}

  get isExportEnabled() {
    return this.featureFlagService.featureFlags.isTrajectoryExportEnabled
  }

  ngOnInit() {}

  async exportTrajectory(e: Event) {
    e.stopPropagation()
    this.popoverController.dismiss()

    await this.showLoadingDialog(
      this.translateService.instant('trajectory.export.loadingDialogMessage')
    )
    await this.trajectoryImportExportService
      .exportTrajectoryViaShareDialog(this.trajectory)
      .then(async (result) => {
        await this.handleExportResult(result)
      })
  }

  async deleteTrajectory(e: Event) {
    e.stopPropagation()
    this.popoverController.dismiss()
    const alert = await this.alertController.create({
      header: this.translateService.instant('trajectory.delete.alertHeader', {
        value: this.trajectory?.placename ?? 'trajectory',
      }),
      message: this.translateService.instant('trajectory.delete.alertMessage'),
      buttons: [
        {
          text: this.translateService.instant('general.cancel'),
          role: 'cancel',
        },
        {
          text: this.translateService.instant('general.delete'),
          cssClass: 'danger',
          handler: async () => {
            await this.showLoadingDialog(
              this.translateService.instant(
                'trajectory.delete.loadingDialogMessage'
              )
            )
            if (this.trajectory.type === TrajectoryType.USERTRACK) {
              this.locationService.stop()
            }
            await this.trajectoryImportExportService
              .deleteTrajectory(this.trajectory)
              .then(async () => {
                await this.hideLoadingDialog()
                await this.showToast(
                  this.translateService.instant(
                    'trajectory.delete.successfulMessage'
                  ),
                  false
                )
                await this.modalController.dismiss()
              })
              .catch(async () => {
                await this.hideLoadingDialog()
                await this.showToast(
                  this.translateService.instant(
                    'trajectory.delete.errorMessage'
                  ),
                  true
                )
              })
          },
        },
      ],
    })
    await alert.present()
  }

  private async handleExportResult(result: TrajectoryExportResult) {
    await this.hideLoadingDialog()
    if (result.success) {
      await this.showToast(
        this.translateService.instant('trajectory.export.successfulMessage'),
        false
      )
    } else {
      await this.showToast(result.errorMessage, true)
    }
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
