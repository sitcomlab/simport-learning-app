import { AfterViewInit, Component } from '@angular/core'
import { StatusBar, Style } from '@capacitor/status-bar'

import { Platform } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'

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
  }
}
