import { TranslateService } from '@ngx-translate/core'
import { Inference } from 'src/app/model/inference'
import { Trajectory } from 'src/app/model/trajectory'
import {
  IInferenceScoring,
  InferenceScoringConfig,
  InferenceScoringType,
} from '../scoring/types'
import { ALL_INFERENCES } from './definitions'

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
    public info: (res: Inference, translate: TranslateService) => string,
    public scoringConfigurations: InferenceScoringConfig[]
  ) {}

  get icon(): string {
    const def = ALL_INFERENCES[this.type]
    if (!def) return 'help'
    return def.iconName
  }

  get outlinedIcon(): string {
    return `${this.icon}-outline`
  }

  get color(): string {
    switch (this.type) {
      case InferenceType.home:
        return '#347d39'
      case InferenceType.work:
        return 'orange'
      case InferenceType.poi:
        return '#68347d'
    }
  }

  public getScoringConfig(type: InferenceScoringType): InferenceScoringConfig {
    return this.scoringConfigurations.find((config) => config.type === type)
  }

  public getName(translateService: TranslateService): string {
    return translateService.instant(this.type)
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
