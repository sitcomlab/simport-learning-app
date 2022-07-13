import { Router } from '@angular/router'
import { Component } from '@angular/core'
import { FeatureFlagService } from '../shared-services/feature-flag/feature-flag.service'
import { AlertController, AlertButton, ToastController } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'

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
    private router: Router
  ) {}

  toImprint() {
    this.router.navigate(['/settings/imprint'])
  }

  toOpenSources() {
    this.router.navigate(['/settings/oss-licenses'])
  }

  toPrivacyPolicy() {
    this.router.navigate(['/settings/privacy-policy'])
  }

  async askToSwitchAppMode() {
    if (
      this.featureFlagService.hasAlternativeFeatureFlags &&
      this.featureFlagService.featureFlags.canSwitchToAlternativeMode === true
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
                const passphrase = data.passphrase ?? undefined
                if (
                  passphrase ===
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
                label: this.translateService.instant(
                  'appMode.switchModeDialogPasswordPlaceholder'
                ),
                name: 'passphrase',
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
