import { Injectable } from '@angular/core'
import { SettingsConfig, SettingsConfigUtil } from './settings.fixtures'

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  settingsConfig: typeof SettingsConfig = SettingsConfig

  private legacyKeys = ['consent', 'first-consent', 'newApp']
  constructor() {
    // remove unused legacy keys
    this.legacyKeys.forEach((k) => localStorage.removeItem(k))
  }

  getValue(settings: SettingsConfig): boolean {
    const value = localStorage.getItem(settings)
    if (value) {
      const parsedValue = JSON.parse(value)
      if (typeof parsedValue === 'boolean') {
        return parsedValue
      }
    }
    const defaultValue = SettingsConfigUtil.defaultValue(settings)
    this.saveValue(settings, defaultValue)
    return defaultValue
  }

  saveValue(settings: SettingsConfig, value: boolean) {
    localStorage.setItem(settings, JSON.stringify(value))
  }
}
