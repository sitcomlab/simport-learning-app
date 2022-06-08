import { Injectable } from '@angular/core'
import {
  deploymentStudy1FeatureFlags,
  FeatureFlags,
} from './feature-flag.fixtures'

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  featureFlags: FeatureFlags = deploymentStudy1FeatureFlags

  constructor() {}
}
