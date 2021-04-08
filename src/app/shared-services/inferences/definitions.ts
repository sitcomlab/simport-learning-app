import { InferenceDefinition, InferenceResult, InferenceType } from './types'

export const WorkInference = new InferenceDefinition(
  'workplace',
  InferenceType.work,
  (lang?: string) => 'Workplace',
  (r: InferenceResult, lang?: string) =>
    `We assume your workplace is at ${r.lonLat} with a confidence of ${r.confidence}.`
)

export const HomeInference = new InferenceDefinition(
  'home',
  InferenceType.home,
  (lang?: string) => 'Home',
  (r: InferenceResult, lang?: string) =>
    `We assume your home is at ${r.lonLat} with a confidence of ${r.confidence}.`
)

export const AllInferences = {
  [HomeInference.id]: HomeInference,
  [WorkInference.id]: WorkInference,
}
