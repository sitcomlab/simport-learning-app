export interface FeatureFlags {
  isTrajectoryInferencesEnabled: boolean
  isTrajectoryMapEnabled: boolean
  isTrajectoryExplorationEnabled: boolean
  isBackgroundInferencesEnabled: boolean
  isBackgroundReverseGeocodingEnabled: boolean
}

export const DefaultFeatureFlags: FeatureFlags = {
  isTrajectoryInferencesEnabled: true,
  isTrajectoryMapEnabled: true,
  isTrajectoryExplorationEnabled: true,
  isBackgroundInferencesEnabled: true,
  isBackgroundReverseGeocodingEnabled: true,
}

export const DeploymentStudy1FeatureFlags: FeatureFlags = {
  isTrajectoryInferencesEnabled: false,
  isTrajectoryMapEnabled: true,
  isTrajectoryExplorationEnabled: false,
  isBackgroundInferencesEnabled: false,
  isBackgroundReverseGeocodingEnabled: false,
}
