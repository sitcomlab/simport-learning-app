import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { AppConfigDefaults } from '../../../assets/configDefaults'

export enum SettingsConfig {
  consent = 'consent',
  newApp = 'newApp',
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  settingsConfig: typeof SettingsConfig = SettingsConfig
  constructor() {}

  getConfig(settings: SettingsConfig): Observable<AppConfigDefaults> {
    const userConfig = localStorage.getItem(settings)
    if (userConfig) {
      return of(JSON.parse(localStorage.getItem(settings)))
    } else {
      const appDefaults = new AppConfigDefaults()
      this.saveConfig(settings, appDefaults)
      return of<AppConfigDefaults>(appDefaults)
    }
  }

  saveConfig(settings: SettingsConfig, appConfig: AppConfigDefaults) {
    localStorage.setItem(settings, JSON.stringify(appConfig))
  }
}
