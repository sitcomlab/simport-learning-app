import { Point } from 'src/app/model/trajectory'
import {
  IInferenceScoring,
  InferenceScoringResult,
  InferenceScoringType,
} from './types'

export class SaturdayActivitiesScoring implements IInferenceScoring {
  public type: InferenceScoringType = InferenceScoringType.saturdayHours9to21
  private referenceStartHours = 9
  private referenceEndHours = 21

  score(cluster: Point[], allClusters: Point[][]): InferenceScoringResult {
    const saturdayHoursPoints = cluster.filter((p) => {
      return p.time !== null ? this.isUsualActivitiesTime(p.time) : false
    })
    const saturdayHoursPointPercentage = saturdayHoursPoints.length / cluster.length
    return { type: this.type, value: saturdayHoursPointPercentage }
  }


  /*/ Function that get activities for Saturday  and then recommends them based previous 
  1. Get array of points for SaturdayActivitiesScoring
  2. Use Convex Hull to select some location points from the data
  3. The data that forms convex hull can be used to select activities/ places to recommend activities on saturdays
  4. Use Geocoding API <Mapbox, Google Maps> to get location name
  NB: We can also look at Time difference and recommend places and activities where one take more time
*/


  private isUsualActivitiesTime(date: Date) {
    return (
      this.isActivitiesHours(date.getHours(), date.getMinutes()) &&
      this.isSaturday(date.getDay())
    )
  }

  private isActivitiesHours(hours: number, minutes: number): boolean {
    const minutesToDecimalHoursFactor = 0.0166

    const hoursAndMinutes = hours + minutes * minutesToDecimalHoursFactor
    return (
      hoursAndMinutes > this.referenceStartHours &&
      hoursAndMinutes < this.referenceEndHours
    )
  }

  private isSaturday(dayOfWeek: number): boolean {
    return dayOfWeek == 6;
  }
}