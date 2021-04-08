import { Inference } from 'src/app/model/inference'
import { TrajectoryData } from 'src/app/model/trajectory'
import { IInferenceScoring, InferenceScoringType } from './scoring/types'

export interface IInferenceEngine {
  scorings: IInferenceScoring[]
  infer(
    trajectory: TrajectoryData,
    inferences: InferenceDefinition[]
  ): InferenceResult[]
}

export class InferenceDefinition {
  constructor(
    public id: string,
    public type: InferenceType,
    public name: (lang?: string) => string,
    public info: (res: InferenceResult, lang?: string) => string
  ) {}
}

export enum InferenceType {
  home,
  work,
}

export type InferenceResult = Inference
