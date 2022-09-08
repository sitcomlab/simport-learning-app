import { Injectable } from '@angular/core'
import { SettingsConfig } from '../settings/settings.fixtures'
import { SettingsService } from '../settings/settings.service'
import { FeatureFlags, FeatureFlagConfig } from './feature-flag.fixtures'

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  // define active featureflags here
  private primaryFlags: FeatureFlags =
    FeatureFlagConfig.deploymentStudy1FeatureFlags
  private secondaryFlags?: FeatureFlags =
    FeatureFlagConfig.deploymentStudy1ControlGroupFeatureFlags

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
      this.settingsService.getValue(SettingsConfig.useAlternativeAppMode)
    )
  }

  set useAlternativeFeatureFlags(newValue: boolean) {
    this.settingsService.saveValue(
      SettingsConfig.useAlternativeAppMode,
      newValue
    )
  }
}
