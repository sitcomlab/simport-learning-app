export enum FeatureFlag {
  TrajectoryInferences = 'trajectory-inferences',
  TrajectoryMap = 'trajectory-map',
  TrajectoryExploration = 'trajectory-exploration',
}

export const DefaultFeatureFlags: Map<FeatureFlag | string, boolean> = new Map([
  [FeatureFlag.TrajectoryInferences, true],
  [FeatureFlag.TrajectoryMap, true],
  [FeatureFlag.TrajectoryExploration, true],
])

export const DeploymentStudy1FeatureFlags: Map<FeatureFlag | string, boolean> =
  new Map([
    [FeatureFlag.TrajectoryInferences, false],
    [FeatureFlag.TrajectoryMap, true],
    [FeatureFlag.TrajectoryExploration, false],
  ])
