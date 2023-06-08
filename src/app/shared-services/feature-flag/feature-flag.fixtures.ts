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

  // feature flags for the second deployment-study
  static deploymentStudyFeatureFlags: FeatureFlags = {
    canSwitchAppMode: false,
    appModeSwitchPassword: 'wwu',
    isHomeLocationTrackingEnabled: true,
    isHomeExploreTrajectoryEnabled: true,
    isHomeImportTrajectoryEnabled: false,
    isHomeDiaryEnabled: true,
    isTrajectoryExportEnabled: false,
    isTrajectoryInferencesTabEnabled: true,
    isTrajectoryMapTabEnabled: true,
    isTrajectoryExplorationTabEnabled: false,
    isInferenceComputationEnabled: true,
    isPoiInferenceComputationEnabled: true,
    isReverseGeocodingEnabled: true,
    isTimetableComputationEnabled: false,
    isNotificationsEnabledForInferences: true,
    isNotificationsToggleEnabled: false,
  }
}
