import { Inference } from 'src/app/model/inference'
import { InferenceScoringType } from './scoring/types'
import { InferenceDefinition, InferenceType } from './types'

export const WorkInference = new InferenceDefinition(
  'workplace',
  InferenceType.work,
  (lang?: string) => 'Workplace',
  (r: Inference, lang?: string) =>
    `We assume your workplace is at ${r.lonLat} with a confidence of ${r.confidence}.`,
  [
    {
      type: InferenceScoringType.nightness,
      confidence: (score) => 1 - score,
      weight: 0.75,
    },
    {
      type: InferenceScoringType.workHours9to5,
      confidence: (score) => score,
      weight: 1,
    },
    {
      type: InferenceScoringType.pointCount,
      confidence: (score) => score,
      weight: 1,
    },
  ]
)

export const HomeInference = new InferenceDefinition(
  'home',
  InferenceType.home,
  (lang?: string) => 'Home',
  (r: Inference, lang?: string) =>
    `We assume your home is at ${r.lonLat} with a confidence of ${r.confidence}.`,
  [
    {
      type: InferenceScoringType.nightness,
      confidence: (score) => score,
      weight: 1,
    },
    {
      type: InferenceScoringType.workHours9to5,
      confidence: (score) => 1 - score,
      weight: 0.75,
    },
    {
      type: InferenceScoringType.pointCount,
      confidence: (score) => score,
      weight: 1,
    },
  ]
)

export const AllInferences = {
  [HomeInference.id]: HomeInference,
  [WorkInference.id]: WorkInference,
}
