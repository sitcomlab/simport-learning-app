export interface FeatureFlags {
  // app-mode config
  canSwitchAppMode?: boolean
  appModeSwitchPassword?: string
  // home-menu entries
  isHomeLocationTrackingEnabled: boolean
  isHomeExploreTrajectoryEnabled: boolean
  isHomeImportTrajectoryEnabled: boolean
  isHomeDiaryEnabled: boolean
  // trajectories list
  isTrajectoryExportEnabled: boolean
  // trajectory-submenu entries
  isTrajectoryInferencesTabEnabled: boolean
  isTrajectoryMapTabEnabled: boolean
  isTrajectoryExplorationTabEnabled: boolean
  // computational features
  isInferenceComputationEnabled: boolean
  isPoiInferenceComputationEnabled: boolean
  isReverseGeocodingEnabled: boolean
  isTimetableComputationEnabled: boolean
  // notifications
  isNotificationsEnabledForInferences: boolean
  isNotificationsToggleEnabled: boolean
}

// default feature flags
export class FeatureFlagConfig {
  static defaultFeatureFlags: FeatureFlags = {
    isHomeLocationTrackingEnabled: true,
    isHomeExploreTrajectoryEnabled: true,
    isHomeImportTrajectoryEnabled: true,
    isHomeDiaryEnabled: true,
    isTrajectoryExportEnabled: true,
    isTrajectoryInferencesTabEnabled: true,
    isTrajectoryMapTabEnabled: true,
    isTrajectoryExplorationTabEnabled: true,
    isInferenceComputationEnabled: true,
    isPoiInferenceComputationEnabled: true,
    isReverseGeocodingEnabled: true,
    isTimetableComputationEnabled: true,
    isNotificationsEnabledForInferences: true,
    isNotificationsToggleEnabled: true,
  }

  // feature flags for the first deployment-study incl. control-group
  static deploymentStudy1FeatureFlags: FeatureFlags = {
    canSwitchAppMode: false,
    appModeSwitchPassword: 'wwu',
    isHomeLocationTrackingEnabled: true,
    isHomeExploreTrajectoryEnabled: true,
    isHomeImportTrajectoryEnabled: false,
    isHomeDiaryEnabled: true,
    isTrajectoryExportEnabled: false,
    isTrajectoryInferencesTabEnabled: false,
    isTrajectoryMapTabEnabled: true,
    isTrajectoryExplorationTabEnabled: false,
    isInferenceComputationEnabled: false,
    isPoiInferenceComputationEnabled: true,
    isReverseGeocodingEnabled: false,
    isTimetableComputationEnabled: false,
    isNotificationsEnabledForInferences: false,
    isNotificationsToggleEnabled: false,
  }

  static deploymentStudy1ControlGroupFeatureFlags: FeatureFlags = {
    canSwitchAppMode: true,
    appModeSwitchPassword: 'wwu',
    isHomeLocationTrackingEnabled: false,
    isHomeExploreTrajectoryEnabled: false,
    isHomeImportTrajectoryEnabled: false,
    isHomeDiaryEnabled: true,
    isTrajectoryExportEnabled: false,
    isTrajectoryInferencesTabEnabled: false,
    isTrajectoryMapTabEnabled: true,
    isTrajectoryExplorationTabEnabled: false,
    isInferenceComputationEnabled: false,
    isPoiInferenceComputationEnabled: false,
    isReverseGeocodingEnabled: false,
    isTimetableComputationEnabled: false,
    isNotificationsEnabledForInferences: false,
    isNotificationsToggleEnabled: false,
  }
}
