import { Point } from 'src/app/model/trajectory'
import {
  IInferenceScoring,
  InferenceScoringResult,
  InferenceScoringType,
} from './types'

export class NightnessScoring implements IInferenceScoring {
  public type: InferenceScoringType = InferenceScoringType.nightness
  private referenceDateMidnight = new Date(Date.UTC(2021, 0, 0, 0, 0, 0))

  score(cluster: Point[], allClusters: Point[][]): InferenceScoringResult {
    // simple average 'nightness' from 1 (midnight) to 0 (midday)
    const diffsToMidnight = cluster
      .filter((p) => p.time !== null)
      .map((p) => {
        return this.computeDiffToMidnight(p)
      })
    const sumDiffs = diffsToMidnight.reduce((a, b) => a + b, 0)
    const avgDiff = sumDiffs / diffsToMidnight.length || -1
    const nightness = 1 - avgDiff / 12.0
    return { type: this.type, value: nightness }
  }

  private computeDiffToMidnight(point: Point): number {
    const referenceHoursAndMinutes = this.getHoursAndMinutes(
      this.referenceDateMidnight
    )

    const pointHoursAndMinutes = this.getHoursAndMinutes(point.time)
    let diffToMidnight = Math.abs(
      pointHoursAndMinutes - referenceHoursAndMinutes
    )
    if (diffToMidnight > 12.0) {
      diffToMidnight = Math.abs(diffToMidnight - 24.0)
    }
    return diffToMidnight
  }

  private getHoursAndMinutes(date: Date) {
    const minutesToDecimalHoursFactor = 0.0166
    return (
      date.getUTCHours() + date.getUTCMinutes() * minutesToDecimalHoursFactor
    )
  }
}
