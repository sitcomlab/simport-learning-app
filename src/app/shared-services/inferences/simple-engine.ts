import { TrajectoryData } from 'src/app/model/trajectory'
import { IInferenceEngine, InferenceDefinition, InferenceResult } from './types'

export class SimpleEngine implements IInferenceEngine {
  infer(
    t: TrajectoryData,
    inferences: InferenceDefinition[]
  ): InferenceResult[] {
    // TODO
    return []
  }
}
