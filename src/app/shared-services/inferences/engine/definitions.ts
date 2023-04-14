import { TranslateService } from '@ngx-translate/core'
import {
  Inference,
  InferenceConfidenceThresholds,
} from 'src/app/model/inference'
import { InferenceScoringType } from '../scoring/types'
import { InferenceDefinition, InferenceType } from './types'

export const WORK_INFERENCE = new InferenceDefinition(
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

export const HOME_INFERENCE = new InferenceDefinition(
  'home',
  InferenceType.home,
  'bed',
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

export const POI_INFERENCE = new InferenceDefinition(
  'poi',
  InferenceType.poi,
  'flag',
  (r: Inference, t: TranslateService) =>
    t.instant('inference.info.poi', { address: r.addressDisplayName }),
  []
)

export const ALL_INFERENCES = {
  [HOME_INFERENCE.type]: HOME_INFERENCE,
  [WORK_INFERENCE.type]: WORK_INFERENCE,
  [POI_INFERENCE.type]: POI_INFERENCE,
}
