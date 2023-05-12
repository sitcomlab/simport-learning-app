import { AfterViewInit, Component } from '@angular/core'
import { StatusBar, Style } from '@capacitor/status-bar'

import { Platform } from '@ionic/angular'
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
  // this is only used on android
  activeAuthentication = new BehaviorSubject(false)

  constructor(
    private platform: Platform,
    private translateService: TranslateService
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

  async ngAfterViewInit() {
    await StatusBar.show()
    await StatusBar.setStyle({ style: Style.Light }) // there is no dark mode (yet)

    this.authenticate()
  }

  async authenticate() {
    this.activeAuthentication.next(true)

    let isAuthenticated = false

    // try to authenticate
    while (!isAuthenticated) {
      try {
        await BiometricAuth.authenticate({
          allowDeviceCredential: true,
        })
        isAuthenticated = true
      } catch (e) {
        const { message, code } = e as BiometryError

        const noCredentialsError = [
          'biometryNotAvailable',
          'biometryNotEnrolled',
          'noDeviceCredential',
        ]

        if (noCredentialsError.includes(code)) {
          alert('Please set up biometric or credential authentication.')
        } else {
          alert(message)
        }
      }
    }
  }
}
