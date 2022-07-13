export interface FeatureFlags {
  appModeSwitchPassword?: string
  canSwitchToAlternativeMode?: boolean
  isHomeLocationTrackingEnabled: boolean
  isHomeExploreTrajectoryEnabled: boolean
  isHomeImportTrajectoryEnabled: boolean
  isHomeDiaryEnabled: boolean
  isTrajectoryInferencesTabEnabled: boolean
  isTrajectoryMapTabEnabled: boolean
  isTrajectoryExplorationTabEnabled: boolean
  isInferenceComputationEnabled: boolean
  isPoiInferenceComputationEnabled: boolean
  isReverseGeocodingEnabled: boolean
  isTimetablePredicitionEnabled: boolean
}

export const defaultFeatureFlags: FeatureFlags = {
  isHomeLocationTrackingEnabled: true,
  isHomeExploreTrajectoryEnabled: true,
  isHomeImportTrajectoryEnabled: true,
  isHomeDiaryEnabled: true,
  isTrajectoryInferencesTabEnabled: true,
  isTrajectoryMapTabEnabled: true,
  isTrajectoryExplorationTabEnabled: true,
  isInferenceComputationEnabled: true,
  isPoiInferenceComputationEnabled: true,
  isReverseGeocodingEnabled: true,
  isTimetablePredicitionEnabled: true,
}

export const deploymentStudy1FeatureFlags: FeatureFlags = {
  appModeSwitchPassword: 'wwu',
  canSwitchToAlternativeMode: false,
  isHomeLocationTrackingEnabled: true,
  isHomeExploreTrajectoryEnabled: true,
  isHomeImportTrajectoryEnabled: true,
  isHomeDiaryEnabled: true,
  isTrajectoryInferencesTabEnabled: false,
  isTrajectoryMapTabEnabled: true,
  isTrajectoryExplorationTabEnabled: false,
  isInferenceComputationEnabled: false,
  isPoiInferenceComputationEnabled: true,
  isReverseGeocodingEnabled: false,
  isTimetablePredicitionEnabled: false,
}

export const deploymentStudy1ControlGroupFeatureFlags: FeatureFlags = {
  appModeSwitchPassword: 'wwu',
  canSwitchToAlternativeMode: true,
  isHomeLocationTrackingEnabled: false,
  isHomeExploreTrajectoryEnabled: false,
  isHomeImportTrajectoryEnabled: false,
  isHomeDiaryEnabled: true,
  isTrajectoryInferencesTabEnabled: false,
  isTrajectoryMapTabEnabled: true,
  isTrajectoryExplorationTabEnabled: false,
  isInferenceComputationEnabled: false,
  isPoiInferenceComputationEnabled: false,
  isReverseGeocodingEnabled: false,
  isTimetablePredicitionEnabled: false,
}
