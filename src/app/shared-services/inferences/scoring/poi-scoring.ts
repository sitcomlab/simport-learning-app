import { Point } from 'src/app/model/trajectory'
import {
  IInferenceScoring,
  InferenceScoringResult,
  InferenceScoringType,
} from './types'

export class POIScoring implements IInferenceScoring {
  public type: InferenceScoringType = InferenceScoringType.poiDuration
  private minDuration = 15
  private maxDuration = 4 * 60

  score(cluster: Point[], allClusters: Point[][]): InferenceScoringResult {
    const startDate = new Date(
      Math.min(...cluster.map((p) => p.time.getTime()))
    )
    const endDate = new Date(Math.max(...cluster.map((p) => p.time.getTime())))

    const durationInMin = (endDate.getTime() - startDate.getTime()) / 60000

    if (this.minDuration < durationInMin && durationInMin < this.maxDuration) {
      return { type: this.type, value: 1 }
    }

    // TODO: gradually decrease value based on min / max
    return { type: this.type, value: 0 }
  }
}
