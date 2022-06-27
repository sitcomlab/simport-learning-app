export interface FeatureFlags {
  isTrajectoryInferencesEnabled: boolean
  isTrajectoryMapEnabled: boolean
  isTrajectoryExplorationEnabled: boolean
  isInferencesEnabled: boolean
  isPoiInferencesEnabled: boolean
  isReverseGeocodingEnabled: boolean
  isTimetablePredicitionEnabled: boolean
}

export const defaultFeatureFlags: FeatureFlags = {
  isTrajectoryInferencesEnabled: true,
  isTrajectoryMapEnabled: true,
  isTrajectoryExplorationEnabled: true,
  isInferencesEnabled: true,
  isPoiInferencesEnabled: true,
  isReverseGeocodingEnabled: true,
  isTimetablePredicitionEnabled: true,
}

export const deploymentStudy1FeatureFlags: FeatureFlags = {
  isTrajectoryInferencesEnabled: false,
  isTrajectoryMapEnabled: true,
  isTrajectoryExplorationEnabled: false,
  isInferencesEnabled: false,
  isPoiInferencesEnabled: true,
  isReverseGeocodingEnabled: false,
  isTimetablePredicitionEnabled: false,
}
