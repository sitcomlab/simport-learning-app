import { Inference } from 'src/app/model/inference'
import { InferenceScoringType } from '../scoring/types'
import { InferenceDefinition, InferenceType } from './types'

export const WorkInference = new InferenceDefinition(
  'workplace',
  InferenceType.work,
  'business',
  (lang?: string) => 'Workplace',
  (r: Inference, lang?: string) => {
    const confidence = (r.confidence * 100).toFixed(0)
    return `We assume you are working at ${r.addressDisplayName} with a confidence of ${confidence} %.`
  },
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
  'home',
  (lang?: string) => 'Home',
  (r: Inference, lang?: string) => {
    const confidence = (r.confidence * 100).toFixed(0)
    return `We assume you are living at ${r.addressDisplayName} with a confidence of ${confidence} %.`
  },
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

export const POIInference = new InferenceDefinition(
  'poi',
  InferenceType.poi,
  'flag',
  (lang?: string) => 'Point of interest',
  (r: Inference, lang?: string) => {
    const latLng = `${r.latLng[0].toFixed(2)}, ${r.latLng[1].toFixed(2)}`
    return `We assume you visited ${latLng}.`
  },
  []
)

export const AllInferences = {
  [HomeInference.type]: HomeInference,
  [WorkInference.type]: WorkInference,
  [POIInference.type]: POIInference,
}
