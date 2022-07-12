import { Injectable } from '@angular/core'
import { defaultFeatureFlags, FeatureFlags } from './feature-flag.fixtures'

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  // define active featureflags here
  private primaryFeatureFlags: FeatureFlags = defaultFeatureFlags
  private secondaryFeatureFlags?: FeatureFlags
  private isAlternativeFeatureFlagsActive = false

  constructor() {}

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
      this.hasAlternativeFeatureFlags && this.isAlternativeFeatureFlagsActive
    )
  }

  set useAlternativeFeatureFlags(newValue: boolean) {
    this.isAlternativeFeatureFlagsActive = newValue
  }
}
