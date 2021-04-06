import { Inference } from 'src/app/model/inference'
import { Point, TrajectoryData } from 'src/app/model/trajectory'

export interface IInferenceEngine {
  infer(
    trajectory: TrajectoryData,
    inferences: InferenceDefinition[]
  ): InferenceResult[]
}

export class InferenceDefinition {
  constructor(
    public id: string,
    public name: (lang?: string) => string,
    public info: (res: InferenceResult, lang?: string) => string,
    public scoringFuncs: ScoringFunc[]
  ) {}
}

export type ScoringFunc = (cluster: Point[]) => number

export type InferenceResult = Inference
