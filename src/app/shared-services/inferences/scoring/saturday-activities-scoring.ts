import { Point } from 'src/app/model/trajectory'
import { ImportsNotUsedAsValues } from 'typescript'
import {
  IInferenceScoring,
  InferenceScoringResult,
  InferenceScoringType,
} from './types'

export class SaturdayActivitiesScoring implements IInferenceScoring {
  public type: InferenceScoringType = InferenceScoringType.saturdayHours9to21
  private referenceStartHours = 9
  private referenceEndHours = 21
  private saturdayHoursPoints 
  private latlng:number[]

  score(cluster: Point[], allClusters: Point[][]): InferenceScoringResult {
    this.saturdayHoursPoints = cluster.filter((p) => {
      return p.time !== null ? this.isUsualActivitiesTime(p.time) : false
    })
    const saturdayHoursPointPercentage = this.saturdayHoursPoints.length / cluster.length
    return { type: this.type, value: saturdayHoursPointPercentage }
  }


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
  
  /*/ Function that get activities for Saturday  and then recommends them based previous 
  1. Get array of points for SaturdayActivitiesScoring
  2. Use Convex Hull to select some location points from the data
  3. The data that forms convex hull can be used to select activities/ places to recommend activities on saturdays
  4. Use Geocoding API <Mapbox, Google Maps> to get location name
  NB: We can also look at Time difference and recommend places and activities where one take more time
  
  
  interface Point {
  latLng: [number, number]
  time?: Date
  accuracy?: number // in meters
  speed?: number // in meters per second
}
  */

//@Gushe
private convexHull (points: Point[]): {
    // Take in a List of Points <lATLONG;TIME,...>
    //ExtractLatlong
    // x = points.Latlong[1]
    //y = points.Latlong[0]
    //Pass it to convex hull method  and get the selected coords
    //return latlong array e.g   [ [51.38254, -2.362804], [51.235249, -2.297804]]

}
  
//@Nikola
  private reverseGeocodingServices(latlng: latlng[][]):<string, number[]>{

    //Input : [ [51.38254, -2.362804], [51.235249, -2.297804]]
   
    //convexhull method called to a variable
    //convexHull(saturdayHoursPoints)
    //implement geocoding service e.g. Mapbox, Google Maps
    //for löoop
    //dictionary
    //return names of places and the latlong as Dictionary/Hashmap e.g. "IFGI": [51.38254, -2.362804]

  }

  //@Brian
  private  mergeGeocodedDictWithTime(){

    //Input : Dictionary/Hashmap e.g

    //Return Object: Location Name, XY and Time       

  }
}