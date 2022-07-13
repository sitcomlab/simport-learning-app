import { Injectable } from '@angular/core'
import { SettingsConfig, SettingsService } from '../settings/settings.service'
import { FeatureFlags, FeatureFlagConfig } from './feature-flag.fixtures'

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  // define active featureflags here
  private primaryFlags: FeatureFlags = FeatureFlagConfig.defaultFeatureFlags
  private secondaryFlags?: FeatureFlags = undefined

  constructor(private settingsService: SettingsService) {}

  get featureFlags(): FeatureFlags {
    if (this.useAlternativeFeatureFlags) {
      return this.secondaryFlags
    }
    return this.primaryFlags
  }

  get hasAlternativeFeatureFlags(): boolean {
    return this.secondaryFlags !== undefined
  }

  get useAlternativeFeatureFlags(): boolean {
    return (
      this.hasAlternativeFeatureFlags &&
      this.settingsService.getValue(
        SettingsConfig.usesAlternativeAppMode,
        false
      )
    )
  }

  set useAlternativeFeatureFlags(newValue: boolean) {
    this.settingsService.saveValue(
      SettingsConfig.usesAlternativeAppMode,
      newValue
    )
  }
}
