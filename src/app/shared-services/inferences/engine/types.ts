import { Inference } from 'src/app/model/inference'
import { Trajectory } from 'src/app/model/trajectory'
import {
  IInferenceScoring,
  InferenceScoringConfig,
  InferenceScoringType,
} from '../scoring/types'
import { AllInferences } from './definitions'

export interface IInferenceEngine {
  scorings: IInferenceScoring[]
  infer(
    trajectory: Trajectory,
    inferences: InferenceDefinition[]
  ): Promise<InferenceResult>
}

export class InferenceDefinition {
  constructor(
    public id: string,
    public type: InferenceType,
    public iconName: string,
    public name: (lang?: string) => string,
    public info: (res: Inference, lang?: string) => string,
    public scoringConfigurations: InferenceScoringConfig[]
  ) {}

  public getScoringConfig(type: InferenceScoringType): InferenceScoringConfig {
    return this.scoringConfigurations.find((config) => config.type === type)
  }

  get icon(): string {
    const def = AllInferences[this.type]
    if (!def) return 'help'
    return def.iconName
  }

  get outlinedIcon(): string {
    return `${this.icon}-outline`
  }
}

export enum InferenceType {
  home = 'home',
  work = 'work',
  poi = 'poi',
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
