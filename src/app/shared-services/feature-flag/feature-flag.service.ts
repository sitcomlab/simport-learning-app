import { Injectable } from '@angular/core'
import { SettingsConfig, SettingsService } from '../settings/settings.service'
import { defaultFeatureFlags, FeatureFlags } from './feature-flag.fixtures'

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  // define active featureflags here
  private primaryFeatureFlags: FeatureFlags = defaultFeatureFlags
  private secondaryFeatureFlags?: FeatureFlags

  constructor(private settingsService: SettingsService) {}

  get featureFlags(): FeatureFlags {
    if (this.useAlternativeFeatureFlags) {
      return this.secondaryFeatureFlags
    }
    return this.primaryFeatureFlags
  }

  get hasAlternativeFeatureFlags(): boolean {
    return this.secondaryFeatureFlags !== undefined
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
