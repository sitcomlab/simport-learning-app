import { Point } from 'src/app/model/trajectory'
import { InferenceDefinition, InferenceResult } from './types'

export const WorkInference = new InferenceDefinition(
  'workplace',
  (lang?: string) => 'Workplace',
  (r: InferenceResult, lang?: string) =>
    `We assume your workplace is at ${r.location} with a confidence of ${r.confidence}.`,
  [(p: Point) => 0] // TODO
)

export const HomeInference = new InferenceDefinition(
  'home',
  (lang?: string) => 'Home',
  (r: InferenceResult, lang?: string) =>
    `We assume your home is at ${r.location} with a confidence of ${r.confidence}.`,
  [(p: Point) => 1] // TODO
)

export const AllInferences = {
  [HomeInference.id]: HomeInference,
  [WorkInference.id]: WorkInference,
}