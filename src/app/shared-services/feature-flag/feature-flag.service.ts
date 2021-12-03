import { Injectable } from '@angular/core'
import { DefaultFeatureFlags, FeatureFlag } from './feature-flag.fixtures'

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  featureFlags = DefaultFeatureFlags

  constructor() {}

  hasFeatureFlag(key: FeatureFlag | string): boolean {
    return this.featureFlags.get(key) || false
  }
}
