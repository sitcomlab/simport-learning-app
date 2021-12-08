import { Injectable } from '@angular/core'
import { DefaultFeatureFlags, FeatureFlags } from './feature-flag.fixtures'

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  featureFlags: FeatureFlags = DefaultFeatureFlags

  constructor() {}
}
