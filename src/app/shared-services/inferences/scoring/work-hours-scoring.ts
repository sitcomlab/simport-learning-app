import { Point } from 'src/app/model/trajectory'
import {
  IInferenceScoring,
  InferenceScoringResult,
  InferenceScoringType,
} from './types'

export class WorkHoursScoring implements IInferenceScoring {
  public type: InferenceScoringType = InferenceScoringType.workHours9to5
  private referenceStartHours = 9
  private referenceEndHours = 17

  score(cluster: Point[], allClusters: Point[][]): InferenceScoringResult {
    const workHourPoints = cluster.filter((p) => {
      return p.time !== null ? this.isUsualWorkingTime(p.time) : false
    })
    const workHourPointPercentage = workHourPoints.length / cluster.length
    return { type: this.type, value: workHourPointPercentage }
  }

  private isUsualWorkingTime(date: Date) {
    return (
      this.isWorkingHours(date.getHours(), date.getMinutes()) &&
      this.isWorkingDay(date.getDay())
    )
  }

  private isWorkingHours(hours: number, minutes: number): boolean {
    const minutesToDecimalHoursFactor = 0.0166

    const hoursAndMinutes = hours + minutes * minutesToDecimalHoursFactor
    return (
      hoursAndMinutes > this.referenceStartHours &&
      hoursAndMinutes < this.referenceEndHours
    )
  }

  private isWorkingDay(dayOfWeek: number): boolean {
    return dayOfWeek > 0 && dayOfWeek < 6
  }
}
