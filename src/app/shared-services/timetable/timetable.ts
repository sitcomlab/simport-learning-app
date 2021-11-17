import { TimetableEntry } from 'src/app/model/timetable'

/** A data structure recording which POIs have been visited how often for every hour of the week */
export class Timetable {
  // keeping tracks of POIs visited, 7 days * 24 hours
  private records: VisitsForDayAndHour[][]

  constructor() {
    this.records = new Array(7).fill(
      new Array(24).fill(new VisitsForDayAndHour())
    )
  }

  /** Add a POI by ID and time spent there
   * @param poiId the Id of the POI to record
   * @param onSiteTimes start and end date of each stay at POI (like in Staypointcluster)
   */
  addPoi(poiId: string, onSiteTimes: [Date, Date][]) {
    onSiteTimes.forEach((onSiteTime) => {
      this.addPoiStay(poiId, onSiteTime[0], onSiteTime[1])
    })
  }

  private async addPoiStay(poiId: string, start: Date, end: Date) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    while (startDate < endDate) {
      this.records[startDate.getDay()][startDate.getHours()].addVisit(poiId)

      // use UTC hours here to have constant increase even with daylight savings
      startDate.setUTCHours(startDate.getUTCHours() + 1)
    }
  }

  toList(): TimetableEntry[] {
    const elements: TimetableEntry[] = []
    this.records.forEach((day, dayIndex) => {
      day.forEach((hour, hourIndex) => {
        hour.visits.forEach((visitCount, inference) => {
          elements.push({
            weekday: dayIndex,
            hour: hourIndex,
            inference,
            count: visitCount,
          })
        })
      })
    })
    return elements
  }
}

/**
 * An entry for one hour of one day in the timetable, keeping track of POIs visited then
 */
class VisitsForDayAndHour {
  public visits: Map<string, number> // poiId, visitCount

  constructor() {
    this.visits = new Map()
  }

  /** Record a visit of a POI (by id) at the corresponding hour and day */
  addVisit(poiId: string): void {
    let updatedVisitCount: number
    if (this.visits.has(poiId)) {
      updatedVisitCount = this.visits.get(poiId) + 1
    } else {
      updatedVisitCount = 1
    }
    this.visits.set(poiId, updatedVisitCount)
  }
}
