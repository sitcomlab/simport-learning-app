/** A data structure recording which POIs have been visited how often for every hour of the week */
export class Timetable {
  // keeping tracks of POIs visited, 7 days * 24 hours
  private records: VisitsForDayAndHour[][]

  constructor() {
    this.records = new Array(7).fill(
      new Array(24).fill(new VisitsForDayAndHour())
    )
  }

  /** get Id of most frequently visited POI at the day and hour of the provided date */
  getMostFrequentPoiIdByDate(date: Date): string {
    const queryDay = date.getDay()
    const queryHour = date.getHours()
    return this.records[queryDay][queryHour].getMostFrequentPoiId()
  }

  /** get Id of most frequently visited POI at the day and hour of the provided date */
  getMostFrequentPoiIdByDayAndHour(day: number, hour: number): string {
    return this.records[day][hour].getMostFrequentPoiId()
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

  private addPoiStay(poiId: string, start: Date, end: Date) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    while (startDate < endDate) {
      this.records[startDate.getDay()][startDate.getHours()].addVisit(poiId)
      // use UTC hours here to have constant increase even with daylight savings
      startDate.setUTCHours(startDate.getUTCHours() + 1)
    }
  }
}

/**
 * An entry for one hour of one day in the timetable, keeping track of POIs visited then
 */
class VisitsForDayAndHour {
  private visits: Map<string, number> // poiId, visitCount
  private mostFrequentPoiId: string
  private mostFrequentPoiCount: number
  constructor() {
    this.visits = new Map()
    this.mostFrequentPoiId = undefined
    this.mostFrequentPoiCount = 0
  }

  /** Record a visit of a POI (by id) at the corresponding hour and day */
  addVisit(poiId: string) {
    let updatedVisitCount
    if (this.visits.has(poiId)) {
      updatedVisitCount = this.visits.get(poiId) + 1
    } else {
      updatedVisitCount = 1
    }
    this.visits.set(poiId, updatedVisitCount)
    if (updatedVisitCount > this.mostFrequentPoiCount) {
      this.mostFrequentPoiId = poiId
      this.mostFrequentPoiCount = updatedVisitCount
    }
  }

  /** Get the Id of the POI a visit of a POI (by id) at the corresponding hour and day
   * Returns undefined if no visits recorded at this hour
   */
  getMostFrequentPoiId(): string {
    return this.mostFrequentPoiId
  }

  /** get number of visits of a POI (by id) at the corresponding hour and day */
  getVisitCountByPoiId(poiId: string): number {
    if (this.visits.has(poiId)) {
      return this.visits.get(poiId)
    } else {
      return 0
    }
  }

  /** Get <poiId, visitCount> for each POI visited at the corresponding hour and day */
  getAllVisits(): Map<string, number> {
    return this.visits
  }
}
