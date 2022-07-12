export interface FeatureFlags {
  isExploreTrajectoryEnabled: boolean
  isImportTrajectoryEnabled: boolean
  isTrajectoryInferencesTabEnabled: boolean
  isTrajectoryMapTabEnabled: boolean
  isTrajectoryExplorationTabEnabled: boolean
  isInferencesEnabled: boolean
  isPoiInferencesEnabled: boolean
  isReverseGeocodingEnabled: boolean
  isTimetablePredicitionEnabled: boolean
}

export const defaultFeatureFlags: FeatureFlags = {
  isExploreTrajectoryEnabled: true,
  isImportTrajectoryEnabled: true,
  isTrajectoryInferencesTabEnabled: true,
  isTrajectoryMapTabEnabled: true,
  isTrajectoryExplorationTabEnabled: true,
  isInferencesEnabled: true,
  isPoiInferencesEnabled: true,
  isReverseGeocodingEnabled: true,
  isTimetablePredicitionEnabled: true,
}

export const deploymentStudy1FeatureFlags: FeatureFlags = {
  isExploreTrajectoryEnabled: true,
  isImportTrajectoryEnabled: true,
  isTrajectoryInferencesTabEnabled: false,
  isTrajectoryMapTabEnabled: true,
  isTrajectoryExplorationTabEnabled: false,
  isInferencesEnabled: false,
  isPoiInferencesEnabled: true,
  isReverseGeocodingEnabled: false,
  isTimetablePredicitionEnabled: false,
}

export const deploymentStudy1ControlGroupFeatureFlags: FeatureFlags = {
  isExploreTrajectoryEnabled: false,
  isImportTrajectoryEnabled: false,
  isTrajectoryInferencesTabEnabled: false,
  isTrajectoryMapTabEnabled: true,
  isTrajectoryExplorationTabEnabled: false,
  isInferencesEnabled: false,
  isPoiInferencesEnabled: false,
  isReverseGeocodingEnabled: false,
  isTimetablePredicitionEnabled: false,
}
