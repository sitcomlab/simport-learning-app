import { Point } from 'src/app/model/trajectory'
import {
  IInferenceScoring,
  InferenceScoringResult,
  InferenceScoringType,
} from './types'

export class PointCountScoring implements IInferenceScoring {
  public type: InferenceScoringType = InferenceScoringType.pointCount

  score(cluster: Point[], allClusters: Point[][]): InferenceScoringResult {
    const minClusterSize = Math.min.apply(
      Math,
      allClusters.map((c) => c.length)
    )
    const maxClusterSize = Math.max.apply(
      Math,
      allClusters.map((c) => c.length)
    )
    const pointCountScore =
      (cluster.length - minClusterSize) *
      (1 / Math.abs(maxClusterSize - minClusterSize))
    return { type: this.type, value: pointCountScore }
  }
}
