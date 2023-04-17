import { AfterViewInit, Component } from '@angular/core'
import { StatusBar, Style } from '@capacitor/status-bar'

import { Platform } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'

import {
  BiometricAuth,
  BiometryError,
} from '@aparajita/capacitor-biometric-auth'
import {
  AndroidSettings,
  IOSSettings,
  NativeSettings,
} from 'capacitor-native-settings'
import { App } from '@capacitor/app'
import { BehaviorSubject } from 'rxjs'

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements AfterViewInit {
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
  }

  async ngAfterViewInit() {
    await StatusBar.show()
    await StatusBar.setStyle({ style: Style.Light }) // there is no dark mode (yet)

    this.authenticate()
  }

  async authenticate() {
    // check if biometric authentication is available
    const bioAvailable = await BiometricAuth.checkBiometry()
    if (!bioAvailable.isAvailable) {
      alert('You should enable Biometric Authentication on your device')

      // open settings if biometric authentication is not enabled
      NativeSettings.open({
        optionAndroid: AndroidSettings.Security,
        optionIOS: IOSSettings.App, // There is no "Security" option in the Enum
      })
      return
    }

    let isAuthenticated = false

    // try to authenticate
    while (!isAuthenticated) {
      try {
        await BiometricAuth.authenticate()
        isAuthenticated = true
      } catch (e) {
        const { message, code } = e as BiometryError
        alert(message)
      }
    }
  }
}
