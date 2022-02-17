import { TranslateService } from '@ngx-translate/core'
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
  (r: Inference, t: TranslateService) => {
    const confidenceValue =
      InferenceConfidenceThresholds.getQualitativeConfidence(r.confidence)
    const confidence = t.instant(`inference.info.confidence.${confidenceValue}`)
    return t.instant('inference.info.work', {
      address: r.addressDisplayName,
      confidence,
    })
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
  (r: Inference, t: TranslateService) => {
    const confidenceValue =
      InferenceConfidenceThresholds.getQualitativeConfidence(r.confidence)
    const confidence = t.instant(`inference.info.confidence.${confidenceValue}`)
    return t.instant('inference.info.home', {
      address: r.addressDisplayName,
      confidence,
    })
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
  (r: Inference, t: TranslateService) => {
    return t.instant('inference.info.poi', { address: r.addressDisplayName })
  },
  []
)

export const AllInferences = {
  [HomeInference.type]: HomeInference,
  [WorkInference.type]: WorkInference,
  [POIInference.type]: POIInference,
}
