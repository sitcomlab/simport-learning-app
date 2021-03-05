import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import {
  IonRouterOutlet,
  LoadingController,
  ModalController,
  ToastController,
} from '@ionic/angular'
import { ToastButton } from '@ionic/core'
import { TrajectoryMeta, TrajectoryType } from '../model/trajectory'
import { LocationService } from '../shared-services/location.service'
import { TrajectorySelectorComponent } from './trajectory-selector/trajectory-selector.component'
import { TrajectoryImportExportService } from '../shared-services/trajectory-import-export.service'

enum TrajectoryMode {
  TRACK = 'tracking',
  CHOOSE = 'choose',
  IMPORT = 'import',
}

@Component({
  selector: 'app-select-trajectory',
  templateUrl: './select-trajectory.page.html',
  styleUrls: ['./select-trajectory.page.scss'],
})
export class SelectTrajectoryPage implements OnInit {
  constructor(
    private modalController: ModalController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private routerOutlet: IonRouterOutlet,
    private router: Router,
    private trajectoryImportExportService: TrajectoryImportExportService,
    public locationService: LocationService
  ) {}

  ngOnInit() {}

  async enableTrajectory(mode: TrajectoryMode) {
    // TODO: persist selected mode

    switch (mode) {
      case TrajectoryMode.TRACK:
        this.router.navigate(['/tracking'])
        return

      case TrajectoryMode.CHOOSE:
        const modal = await this.modalController.create({
          component: TrajectorySelectorComponent,
          swipeToClose: true,
          presentingElement: this.routerOutlet.nativeEl,
          cssClass: 'auto-height',
        })
        modal.present()
        const { data: t } = await modal.onWillDismiss<TrajectoryMeta>()
        if (t) this.router.navigate([`/trajectory/${t.type}/${t.id}`])
        return

      case TrajectoryMode.IMPORT:
        await this.showLoadingDialog('Importing trajectory...')
        await this.trajectoryImportExportService
          .selectAndImportTrajectory()
          .then(async (result) => {
            this.hideLoadingDialog()
            if (result.success) {
              const viewTrajectoryButton = {
                text: 'View',
                handler: async () => {
                  this.router.navigate([
                    `/trajectory/${TrajectoryType.IMPORT}/${result.trajectoryId}`,
                  ])
                },
              }
              await this.showToastWithButtons(
                'Trajectory successfully imported',
                false,
                [viewTrajectoryButton]
              )
            } else {
              await this.showToast(result.errorMessage, true)
            }
          })
        return

      default:
        assertUnreachable(mode)
    }
  }

  private async showToast(message: string, isError: boolean) {
    await this.showToastWithButtons(message, isError, null)
  }

  private async showToastWithButtons(
    message: string,
    isError: boolean,
    buttons: ToastButton[]
  ) {
    const toast = await this.toastController.create({
      message,
      color: isError ? 'danger' : 'success',
      duration: buttons.length > 0 ? 4000 : 2000,
      buttons,
    })
    toast.present()
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
}

function assertUnreachable(x: never): never {
  throw new Error('code should be unreachable')
}
