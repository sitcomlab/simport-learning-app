import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import {
  IonRouterOutlet,
  LoadingController,
  ModalController,
  ToastController,
} from '@ionic/angular'
import { HttpClient } from '@angular/common/http'
import { ToastButton } from '@ionic/core'
import { TranslateService } from '@ngx-translate/core'
import { DebugWindowComponent } from '../debug-window/debug-window.component'
import { TrajectoryMeta, TrajectoryType } from '../model/trajectory'
import { LocationService } from '../shared-services/location/location.service'
import { TrajectoryImportExportService } from '../shared-services/trajectory/trajectory-import-export.service'
import { TrajectorySelectorComponent } from './trajectory-selector/trajectory-selector.component'
import { AppConfigDefaults } from '../../assets/configDefaults'
import {
  SettingsService,
  SettingsConfig,
} from './../shared-services/settings/settings.service'
import { UserConfiguration } from '../model/user-configuration'
import { FeatureFlagService } from '../shared-services/feature-flag/feature-flag.service'

enum TrajectoryMode {
  track = 'tracking',
  choose = 'choose',
  import = 'import',
}

@Component({
  selector: 'app-select-trajectory',
  templateUrl: './select-trajectory.page.html',
  styleUrls: ['./select-trajectory.page.scss'],
})
export class SelectTrajectoryPage implements OnInit {
  trajectoryMode: typeof TrajectoryMode = TrajectoryMode // for usage in template
  private clickInterval = 500
  private debugWindowClicks = 8
  private lastOnClicks = [] // contains timestamps of title clicks, newest comes first
  private jsonDataResult: any
  private firstTimeOpenAppDefault: AppConfigDefaults
  private userConfiguration: UserConfiguration

  constructor(
    public locationService: LocationService,
    public translateService: TranslateService,
    public featureFlagService: FeatureFlagService,
    private modalController: ModalController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private routerOutlet: IonRouterOutlet,
    private router: Router,
    private http: HttpClient,
    private trajectoryImportExportService: TrajectoryImportExportService,
    private settingsService: SettingsService
  ) {}

  // fired on title click
  // used for multiple click detection
  async onTitleClick() {
    const lastClick = this.lastOnClicks[0]
    const now = Date.now()

    // the last click was too long ago, reset state
    if (!lastClick || now - lastClick > this.clickInterval) {
      this.lastOnClicks = [now]
      return
    }

    const toasts = [
      { message: '🦖🎉 You found the secret debug window!', duration: 1000 },
      { message: '🦉 You are 1 click away from the debug window' },
      { message: '🐬 You are 2 clicks away from the debug window' },
      { message: '🦘 You are 3 clicks away from the debug window' },
    ]

    // notify the user when they are 3, 2 or 1 click(s) away from the debug window
    // adapted from the android developer settings
    this.lastOnClicks.unshift(now)
    const clicksAway = this.debugWindowClicks - this.lastOnClicks.length
    if (toasts[clicksAway]) {
      const toast = await this.toastController.create({
        duration: 500,
        ...toasts[clicksAway],
      })
      toast.present()
    }

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

  async enableTrajectory(mode: TrajectoryMode) {
    // TODO: persist selected mode

    switch (mode) {
      case TrajectoryMode.track:
        this.router.navigate(['/tracking'])
        return

      case TrajectoryMode.choose:
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

      case TrajectoryMode.import:
        await this.trajectoryImportExportService
          .selectAndImportTrajectory(async () => {
            // did select file
            const dialogMessage = this.translateService.instant(
              'trajectory.import.loadingDialogMessage'
            )
            await this.showLoadingDialog(dialogMessage)
          })
          .then(async (result) => {
            await this.hideLoadingDialog()
            if (result.success) {
              const viewString = this.translateService.instant('general.view')
              const viewTrajectoryButton = {
                text: viewString,
                handler: async () => {
                  this.router.navigate([
                    `/trajectory/${TrajectoryType.IMPORT}/${result.trajectoryId}`,
                  ])
                },
              }
              const toastMessage = this.translateService.instant(
                'trajectory.import.successfulMessage'
              )
              await this.showToastWithButtons(toastMessage, false, [
                viewTrajectoryButton,
              ])
            } else {
              await this.showToast(result.errorMessage, true)
            }
          })
        return

      default:
        return
    }
  }

  navigateToDiary() {
    this.router.navigate(['/diary'])
  }

  async createExample() {
    this.settingsService.getConfig(SettingsConfig.newApp).subscribe(
      (firstTimeOpenApp) => (this.firstTimeOpenAppDefault = firstTimeOpenApp),
      () => null,
      () => {
        this.userConfiguration = new UserConfiguration()
        this.userConfiguration.hasFirstOpenApp =
          this.firstTimeOpenAppDefault.defaultFirstTimeOpenApp
      }
    )
    if (this.userConfiguration.hasFirstOpenApp) {
      this.importExample()
    }
  }

  setFirstTimeApp(consented: UserConfiguration) {
    this.firstTimeOpenAppDefault.defaultFirstTimeOpenApp =
      consented.hasFirstOpenApp
    this.settingsService.saveConfig(
      SettingsConfig.newApp,
      this.firstTimeOpenAppDefault
    )
  }

  importExample() {
    this.http.get('assets/trajectories/muenster.json').subscribe((res) => {
      this.jsonDataResult = res
    })

    setTimeout(() => {
      new Promise((resolve) => {
        const json = JSON.stringify(this.jsonDataResult)
        const trajectory =
          this.trajectoryImportExportService.createTrajectoryFromImport(
            json,
            this.translateService.instant('general.exampleTrajectoryName'),
            true
          )
        return this.trajectoryImportExportService
          .addTrajectory(trajectory)
          .then(async () => {
            resolve({
              success: true,
              trajectoryId: trajectory.id,
              errorMessage: null,
            })
          })
          .catch(async () => {
            resolve({
              success: false,
              trajectoryId: null,
              errorMessage: this.translateService.instant(
                'trajectory.import.errorMessage'
              ),
            })
          })
      })
    }, 2000)
    this.userConfiguration = new UserConfiguration()
    this.userConfiguration.hasFirstOpenApp = false
    this.setFirstTimeApp(this.userConfiguration)
  }

  ngOnInit() {
    this.createExample()
  }

  private async showToast(message: string, isError: boolean) {
    await this.showToastWithButtons(message, isError, [])
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
