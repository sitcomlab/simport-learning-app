import { Injectable } from '@angular/core'
import { defaultFeatureFlags, FeatureFlags } from './feature-flag.fixtures'

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  featureFlags: FeatureFlags = defaultFeatureFlags

  constructor() {}
}
