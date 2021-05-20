import { Inference } from 'src/app/model/inference'
import { TrajectoryData } from 'src/app/model/trajectory'
import {
  IInferenceScoring,
  InferenceScoringConfig,
  InferenceScoringType,
} from '../scoring/types'

export interface IInferenceEngine {
  scorings: IInferenceScoring[]
  infer(
    trajectory: TrajectoryData,
    inferences: InferenceDefinition[]
  ): InferenceResult
}

export class InferenceDefinition {
  constructor(
    public id: string,
    public type: InferenceType,
    public name: (lang?: string) => string,
    public info: (res: Inference, lang?: string) => string,
    public scoringConfigurations: InferenceScoringConfig[]
  ) {}

  public getScoringConfig(type: InferenceScoringType): InferenceScoringConfig {
    return this.scoringConfigurations.find((config) => config.type === type)
  }
}

export enum InferenceType {
  home = 'home',
  work = 'work',
}

export enum InferenceResultStatus {
  tooManyCoordinates,
  noInferencesFound,
  successful,
}

export type InferenceResult = {
  status: InferenceResultStatus
  inferences: Inference[]
}
