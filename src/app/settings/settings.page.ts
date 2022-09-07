import { Router } from '@angular/router'
import { Component } from '@angular/core'
import { FeatureFlagService } from '../shared-services/feature-flag/feature-flag.service'
import { AlertController, ToastController } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'
import { LogfileService } from '../shared-services/logfile/logfile.service'
import { LogEventScope, LogEventType } from '../shared-services/logfile/types'

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  constructor(
    public featureFlagService: FeatureFlagService,
    private translateService: TranslateService,
    private alertController: AlertController,
    private toastController: ToastController,
    private router: Router,
    private logfileService: LogfileService
  ) {}

  toImprint() {
    this.logfileService.log(
      'View imprint',
      LogEventScope.app,
      LogEventType.click
    )
    this.router.navigate(['/settings/imprint'])
  }

  toOpenSources() {
    this.router.navigate(['/settings/oss-licenses'])
  }

  toPrivacyPolicy() {
    this.logfileService.log(
      'View privacy policyy',
      LogEventScope.app,
      LogEventType.click
    )
    this.router.navigate(['/settings/privacy-policy'])
  }

  async askToSwitchAppMode() {
    if (
      this.featureFlagService.hasAlternativeFeatureFlags &&
      this.featureFlagService.featureFlags.canSwitchAppMode === true
    ) {
      const usesPassword =
        this.featureFlagService.featureFlags.appModeSwitchPassword !== undefined
      const alert = await this.alertController.create({
        header: this.translateService.instant('appMode.switchModeDialogTitle'),
        buttons: [
          {
            text: this.translateService.instant('general.cancel'),
            role: 'cancel',
          },
          {
            text: this.translateService.instant(
              'appMode.switchModeProceedButton'
            ),
            handler: (data: any) => {
              if (usesPassword) {
                const password = data.password ?? undefined
                if (
                  password ===
                  this.featureFlagService.featureFlags.appModeSwitchPassword
                ) {
                  this.switchAppMode()
                } else {
                  this.showToast('appMode.switchModeWrongPasswordMessage', true)
                }
              } else {
                this.switchAppMode()
              }
            },
          },
        ],
        message: usesPassword
          ? this.translateService.instant('appMode.switchModeDialogMessage')
          : undefined,
        inputs: usesPassword
          ? [
              {
                name: 'password',
                attributes: {
                  autocomplete: 'off',
                  autocorrect: 'off',
                },
                placeholder: this.translateService.instant(
                  'appMode.switchModeDialogPasswordPlaceholder'
                ),
              },
            ]
          : undefined,
      })

      await alert.present()
    }
  }

  private switchAppMode() {
    this.featureFlagService.useAlternativeFeatureFlags =
      !this.featureFlagService.useAlternativeFeatureFlags
    this.showToast('appMode.switchModeSuccessMessage', false)
  }

  private async showToast(message: string, isError: boolean) {
    const toast = await this.toastController.create({
      message: this.translateService.instant(message),
      color: isError ? 'danger' : 'success',
      duration: 2000,
    })
    await toast.present()
  }
}
