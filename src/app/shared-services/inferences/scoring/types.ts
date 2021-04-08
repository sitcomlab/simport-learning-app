import { Point } from 'src/app/model/trajectory'

export interface IInferenceScoring {
  type: InferenceScoringType
  score(cluster: Point[]): InferenceScoringResult
}

export type InferenceScoringResult = {
  type: InferenceScoringType
  value: number
}

export enum InferenceScoringType {
  spatialVariance,
  temporalContinuity,
  pointCount,
  nightness,
}
