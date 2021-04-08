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
import { DebugWindowComponent } from '../debug-window/debug-window.component'

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

  private CLICK_INTERVAL = 500
  private DEBUG_WINDOW_CLICKS = 8
  private lastOnClicks = []

  // fired on title click
  // used for multiple click detection
  private async onTitleClick() {
    const now = Date.now()

    if (
      this.lastOnClicks.length === 0 ||
      Math.abs(now - this.lastOnClicks[this.lastOnClicks.length - 1]) <=
        this.CLICK_INTERVAL
    ) {
      // not enough clicks, keep on
      this.lastOnClicks.push(now)

      // notify the user when he/she is 3, 2 or 1 click(s) away from the debug window
      // adapted from the android developer settings
      const clicksAway = this.DEBUG_WINDOW_CLICKS - this.lastOnClicks.length
      if (clicksAway <= 3) {
        const special = ['🦘', '🐬', '🦉']
        const counterMessage = `${
          special[clicksAway - 1]
        } You are ${clicksAway} ${
          clicksAway > 1 ? 'clicks' : 'click'
        } away from the debug window`
        const successMessage = `🦖🎉 You found the secret debug window!`
        const toast = await this.toastController.create({
          message: clicksAway > 0 ? counterMessage : successMessage,
          duration: clicksAway > 0 ? 500 : 1000,
        })
        toast.present()

        // all clicks were in the required interval
        // presenting debug modal
        if (clicksAway === 0) {
          this.lastOnClicks = []
          const modal = await this.modalController.create({
            component: DebugWindowComponent,
            swipeToClose: false,
            backdropDismiss: false,
            presentingElement: this.routerOutlet.nativeEl,
            cssClass: 'auto-height',
          })
          modal.present()
        }
      }
    } else {
      // counter array is either empty or last click was after click interval limit
      this.lastOnClicks = [now]
    }
  }

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
        await this.trajectoryImportExportService
          .selectAndImportTrajectory(async () => {
            // did select file
            await this.showLoadingDialog('Importing trajectory...')
          })
          .then(async (result) => {
            await this.hideLoadingDialog()
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
