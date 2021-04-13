import { InferenceScoringType } from './scoring/types'
import { InferenceDefinition, InferenceResult, InferenceType } from './types'

export const WorkInference = new InferenceDefinition(
  'workplace',
  InferenceType.work,
  (lang?: string) => 'Workplace',
  (r: InferenceResult, lang?: string) =>
    `We assume your workplace is at ${r.lonLat} with a confidence of ${r.confidence}.`,
  [
    {
      type: InferenceScoringType.nightness,
      validRange: [0, 1],
      confidence: (score) => 1 - score,
      weight: 0.75,
    },
    {
      type: InferenceScoringType.workHours9to5,
      validRange: [0, 1],
      confidence: (score) => score,
      weight: 1,
    },
  ]
)

export const HomeInference = new InferenceDefinition(
  'home',
  InferenceType.home,
  (lang?: string) => 'Home',
  (r: InferenceResult, lang?: string) =>
    `We assume your home is at ${r.lonLat} with a confidence of ${r.confidence}.`,
  [
    {
      type: InferenceScoringType.nightness,
      validRange: [0, 1],
      confidence: (score) => score,
      weight: 1,
    },
    {
      type: InferenceScoringType.workHours9to5,
      validRange: [0, 1],
      confidence: (score) => 1 - score,
      weight: 0.75,
    },
  ]
)

export const AllInferences = {
  [HomeInference.id]: HomeInference,
  [WorkInference.id]: WorkInference,
}
