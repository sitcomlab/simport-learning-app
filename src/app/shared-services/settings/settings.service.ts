import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { AppConfigDefaults } from '../../../assets/configDefaults'

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor() {}

  getConfig(key: string): Observable<AppConfigDefaults> {
    const userConfig = localStorage.getItem(key)
    if (userConfig) {
      return of(JSON.parse(localStorage.getItem(key)))
    } else {
      const appDefaults = new AppConfigDefaults()
      this.saveConfig(key, appDefaults)
      return of<AppConfigDefaults>(appDefaults)
    }
  }

  saveConfig(key: string, appConfig: AppConfigDefaults) {
    localStorage.setItem(key, JSON.stringify(appConfig))
  }
}
