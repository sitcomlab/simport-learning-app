import { Point } from 'src/app/model/trajectory'
import {
  IInferenceScoring,
  InferenceScoringResult,
  InferenceScoringType,
} from './types'

export class NightnessScoring implements IInferenceScoring {
  public type: InferenceScoringType = InferenceScoringType.nightness
  private referenceDate = new Date(Date.UTC(2021, 0, 0, 0, 0, 0))
  private minutesToDecimalHoursFactor = 0.0166

  score(cluster: Point[]): InferenceScoringResult {
    // simple average 'nightness' from 1 (midnight) to 0 (midday)
    const referenceHoursAndMinutes =
      this.referenceDate.getUTCHours() +
      this.referenceDate.getUTCMinutes() * this.minutesToDecimalHoursFactor
    const diffsToMidnight = cluster
      .filter((p) => p.time !== null)
      .map((p) => {
        const pointHoursAndMinutes =
          p.time.getUTCHours() +
          p.time.getUTCMinutes() * this.minutesToDecimalHoursFactor
        let diffToMidnight = Math.abs(
          pointHoursAndMinutes - referenceHoursAndMinutes
        )
        if (diffToMidnight > 12.0) {
          diffToMidnight = Math.abs(diffToMidnight - 24.0)
        }
        return diffToMidnight
      })
    const sumDiffs = diffsToMidnight.reduce((a, b) => a + b, 0)
    const avgDiff = sumDiffs / diffsToMidnight.length || -1
    const nightness = 1 - avgDiff / 12.0
    return { type: this.type, value: nightness }
  }
}
