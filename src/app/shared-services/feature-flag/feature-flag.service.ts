import { Injectable } from '@angular/core'
import {
  DefaultFeatureFlags,
  DeploymentStudy1FeatureFlags,
  FeatureFlags,
} from './feature-flag.fixtures'

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  featureFlags: FeatureFlags = DeploymentStudy1FeatureFlags // DefaultFeatureFlags

  constructor() {}
}
