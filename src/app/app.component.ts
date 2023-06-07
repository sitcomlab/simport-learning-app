import { AfterViewInit, Component } from '@angular/core'
import { StatusBar, Style } from '@capacitor/status-bar'

import { AlertController, Platform } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'

import {
  BiometricAuth,
  BiometryError,
} from '@aparajita/capacitor-biometric-auth'
import { App } from '@capacitor/app'
import { BehaviorSubject } from 'rxjs'

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  // authentication is valid for 60 seconds
  private static authenticationValidTime = 60

  // this is only used on android
  activeAuthentication = new BehaviorSubject(false)
  lastSuccessfulAuthentication = new BehaviorSubject(-1)

  private authenticationAlert?: HTMLIonAlertElement = undefined

  constructor(
    private platform: Platform,
    private translateService: TranslateService,
    private alertController: AlertController
  ) {
    // init translation with browser-language (== device-language)
    this.translateService.addLangs(['en', 'de'])
    const browserLang = this.translateService.getBrowserLang()
    if (this.translateService.getLangs().includes(browserLang)) {
      this.translateService.use(browserLang)
    } else {
      this.translateService.use(this.translateService.defaultLang)
    }

    // authenticate on resume
    App.addListener('resume', () => {
      // the resume event is coming from the biometric authentication dialog
      if (this.platform.is('android') && this.activeAuthentication.value) {
        this.activeAuthentication.next(false)
        return
      }
      this.authenticate()
    })
  }

  get timestamp(): number {
    return new Date().getTime() / 1000
  }

  async ngAfterViewInit() {
    await StatusBar.show()
    await StatusBar.setStyle({ style: Style.Light }) // there is no dark mode (yet)

    this.authenticate()
  }

  async authenticate() {
    if (!this.needsAuthentication()) {
      return
    }
    this.activeAuthentication.next(true)

    let isAuthenticated = false

    // try to authenticate
    while (!isAuthenticated) {
      try {
        await BiometricAuth.authenticate({
          allowDeviceCredential: true,
        })
        isAuthenticated = true
        this.lastSuccessfulAuthentication.next(this.timestamp)
      } catch (e) {
        const { message, code } = e as BiometryError

        const noCredentialsError = [
          'biometryNotAvailable',
          'biometryNotEnrolled',
          'noDeviceCredential',
        ]

        if (noCredentialsError.includes(code)) {
          this.showAlert(this.translateService.instant('pinLock.noAuthMessage'))
        } else {
          this.showAlert(message)
        }
      }
    }
  }

  private async showAlert(message: string) {
    if (this.authenticationAlert !== undefined) {
      return
    }

    this.authenticationAlert = await this.alertController.create({
      message,
      buttons: [
        {
          text: this.translateService.instant('general.ok'),
          handler: () => {
            this.authenticationAlert?.dismiss()
            this.authenticationAlert = undefined
          },
        },
      ],
      backdropDismiss: false,
    })
    await this.authenticationAlert?.present()
  }

  private needsAuthentication(): boolean {
    const authTime = this.lastSuccessfulAuthentication.value
    return (
      authTime < 0 ||
      this.timestamp - authTime > AppComponent.authenticationValidTime
    )
  }
}
