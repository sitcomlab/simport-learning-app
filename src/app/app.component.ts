import { AfterViewInit, Component } from '@angular/core'

import { Platform } from '@ionic/angular'
import { SplashScreen } from '@ionic-native/splash-screen/ngx'
import { StatusBar } from '@ionic-native/status-bar/ngx'
import { TranslateService } from '@ngx-translate/core'

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private translateService: TranslateService
  ) {
    /// init translation with browser-language (== device-language)
    this.translateService.use(this.translateService.getBrowserLang())
  }

  ngAfterViewInit() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault()
      this.splashScreen.hide()
    })
  }
}
