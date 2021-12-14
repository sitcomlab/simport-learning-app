export interface FeatureFlags {
  isTrajectoryInferencesEnabled: boolean
  isTrajectoryMapEnabled: boolean
  isTrajectoryExplorationEnabled: boolean
  isInferencesEnabled: boolean
  isReverseGeocodingEnabled: boolean
  isTimetablePredicitionEnabled: boolean
}

export const DefaultFeatureFlags: FeatureFlags = {
  isTrajectoryInferencesEnabled: true,
  isTrajectoryMapEnabled: true,
  isTrajectoryExplorationEnabled: true,
  isInferencesEnabled: true,
  isReverseGeocodingEnabled: true,
  isTimetablePredicitionEnabled: true,
}

export const DeploymentStudy1FeatureFlags: FeatureFlags = {
  isTrajectoryInferencesEnabled: false,
  isTrajectoryMapEnabled: true,
  isTrajectoryExplorationEnabled: false,
  isInferencesEnabled: false,
  isReverseGeocodingEnabled: false,
  isTimetablePredicitionEnabled: false,
}
