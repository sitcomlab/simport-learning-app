export interface FeatureFlags {
  // app-mode config
  canSwitchAppMode?: boolean
  appModeSwitchPassword?: string
  // home-menu entries
  isHomeLocationTrackingEnabled: boolean
  isHomeExploreTrajectoryEnabled: boolean
  isHomeImportTrajectoryEnabled: boolean
  isHomeDiaryEnabled: boolean
  // show notifications
  isNotificationEnable: boolean
  // trajectories list
  isTrajectoryExportEnabled: boolean
  // trajectory-submenu entries
  isTrajectoryInferencesTabEnabled: boolean
  isNotificationShownForInferences: boolean
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
    isNotificationEnable: true,
    isTrajectoryExportEnabled: true,
    isTrajectoryInferencesTabEnabled: true,
    isNotificationShownForInferences: true,
    isTrajectoryExplorationTabEnabled: true,
    isInferenceComputationEnabled: true,
    isPoiInferenceComputationEnabled: true,
    isReverseGeocodingEnabled: true,
    isTimetableComputationEnabled: true,
  }

  // feature flags for the first deployment-study incl. control-group
  static deploymentStudy1FeatureFlags: FeatureFlags = {
    canSwitchAppMode: false,
    appModeSwitchPassword: 'wwu',
    isHomeLocationTrackingEnabled: true,
    isHomeExploreTrajectoryEnabled: true,
    isHomeImportTrajectoryEnabled: false,
    isHomeDiaryEnabled: true,
    isNotificationEnable: false,
    isTrajectoryExportEnabled: false,
    isTrajectoryInferencesTabEnabled: false,
    isNotificationShownForInferences: false,
    isTrajectoryExplorationTabEnabled: false,
    isInferenceComputationEnabled: false,
    isPoiInferenceComputationEnabled: true,
    isReverseGeocodingEnabled: false,
    isTimetableComputationEnabled: false,
  }

  static deploymentStudy1ControlGroupFeatureFlags: FeatureFlags = {
    canSwitchAppMode: true,
    appModeSwitchPassword: 'wwu',
    isHomeLocationTrackingEnabled: false,
    isHomeExploreTrajectoryEnabled: false,
    isHomeImportTrajectoryEnabled: false,
    isHomeDiaryEnabled: true,
    isNotificationEnable: false,
    isTrajectoryExportEnabled: false,
    isTrajectoryInferencesTabEnabled: false,
    isNotificationShownForInferences: false,
    isTrajectoryExplorationTabEnabled: false,
    isInferenceComputationEnabled: false,
    isPoiInferenceComputationEnabled: false,
    isReverseGeocodingEnabled: false,
    isTimetableComputationEnabled: false,
  }
}
