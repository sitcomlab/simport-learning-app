export interface FeatureFlags {
  // app-mode config
  canSwitchAppMode?: boolean
  appModeSwitchPassword?: string
  // home-menu entries
  isHomeLocationTrackingEnabled: boolean
  isHomeExploreTrajectoryEnabled: boolean
  isHomeImportTrajectoryEnabled: boolean
  isHomeDiaryEnabled: boolean
  // trajectory-submenu entries
  isTrajectoryInferencesTabEnabled: boolean
  isTrajectoryMapTabEnabled: boolean
  isTrajectoryExplorationTabEnabled: boolean
  // computational features
  isInferenceComputationEnabled: boolean
  isPoiInferenceComputationEnabled: boolean
  isReverseGeocodingEnabled: boolean
  isTimetableComputationEnabled: boolean
}

// default feature flags
export class FeatureFlagConfig {
  static defaultFeatureFlags: FeatureFlags = {
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
    isTimetableComputationEnabled: true,
  }

  // feature flags for the first deployment-study incl. control-group
  static deploymentStudy1FeatureFlags: FeatureFlags = {
    canSwitchAppMode: true,
    appModeSwitchPassword: 'wwu',
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
    isTimetableComputationEnabled: false,
  }

  static deploymentStudy1ControlGroupFeatureFlags: FeatureFlags = {
    canSwitchAppMode: false,
    appModeSwitchPassword: 'wwu',
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
    isTimetableComputationEnabled: false,
  }
}
