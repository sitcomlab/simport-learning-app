import {
  Inference,
  InferenceConfidenceThresholds,
} from 'src/app/model/inference'
import { InferenceScoringType } from '../scoring/types'
import { InferenceDefinition, InferenceType } from './types'

export const WorkInference = new InferenceDefinition(
  'workplace',
  InferenceType.work,
  'business',
  (lang?: string) => 'Workplace',
  (r: Inference, lang?: string) => {
    const confidence = (r.confidence * 100).toFixed(0)
    return `We assume you are working at ${
      r.addressDisplayName
    } with ${InferenceConfidenceThresholds.getQualitativeConfidence(
      r.confidence
    )}.`
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
    return `We assume you are living at ${
      r.addressDisplayName
    } with ${InferenceConfidenceThresholds.getQualitativeConfidence(
      r.confidence
    )}.`
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
    return `We assume you visited ${r.addressDisplayName}.`
  },
  []
)

export const AllInferences = {
  [HomeInference.type]: HomeInference,
  [WorkInference.type]: WorkInference,
  [POIInference.type]: POIInference,
}
