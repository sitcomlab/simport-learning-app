import { Injectable } from '@angular/core'
import { Inference } from 'src/app/model/inference'
import { Hour, Visit, Weekday } from 'src/app/model/timetable'
import { SqliteService } from '../db/sqlite.service'

@Injectable({
  providedIn: 'root',
})
export class TimetableService {
  constructor(private sqliteService: SqliteService) {}

  async createTimetable(trajectoryId: string, weekday: number): Promise<void> {
    await this.sqliteService.upsertWeekday(trajectoryId, weekday)
  }

  async getWeekdayId(trajectoryId: string, weekday: number): Promise<string> {
    const weekdayId = await this.sqliteService.getWeekdayId(
      trajectoryId,
      weekday
    )
    return weekdayId
  }

  private async getWeekdays(trajectoryId: string): Promise<Weekday[]> {
    return this.sqliteService.getWeekdays(trajectoryId)
  }

  private async getHours(weekdayId: string): Promise<Hour[]> {
    return this.sqliteService.getHours(weekdayId)
  }

  async createHour(
    trajectoryId: string,
    weekday: number,
    hour: number
  ): Promise<void> {
    await this.sqliteService.upsertHour(
      await this.getWeekdayId(trajectoryId, weekday),
      hour
    )
  }

  async getHourId(
    trajectoryId: string,
    weekday: number,
    hour: number
  ): Promise<string> {
    const hourId = await this.sqliteService.getHourId(
      await this.getWeekdayId(trajectoryId, weekday),
      hour
    )
    return hourId
  }

  async addVisit(inferenceId: string, hourId: string): Promise<void> {
    await this.sqliteService.addVisit(inferenceId, hourId)
  }

  async addPoi(inference: Inference, onSiteTimes: [Date, Date][]) {
    const existingWeekdays = await this.getWeekdays(inference.trajectoryId)
    const existingHours = await Promise.all(
      existingWeekdays.map(async (weekday) => await this.getHours(weekday.id))
    )

    onSiteTimes.forEach(async (onSiteTime) => {
      this.addPoiStay(
        inference,
        onSiteTime[0],
        onSiteTime[1],
        existingWeekdays,
        existingHours
      )
    })
  }

  private async addPoiStay(
    inference: Inference,
    start: Date,
    end: Date,
    existingWeekdays: Weekday[],
    existingHours: Hour[][]
  ) {
    const startDate = new Date(start)
    const endDate = new Date(end)

    while (startDate < endDate) {
      // create weekday if not exists
      const existingWeekday = existingWeekdays.find(
        (weekday) => weekday.weekday === startDate.getDay()
      )
      if (!existingWeekday) {
        await this.createTimetable(inference.trajectoryId, startDate.getDay())
        await this.createHour(
          inference.trajectoryId,
          startDate.getDay(),
          startDate.getHours()
        )
      } else {
        // create hour if not exists
        const existingHour = existingHours
          .map((hours) => {
            return hours.find((hour) => hour.weekdayId === existingWeekday.id)
          })
          .filter((e) => e)
          .find((hour) => hour.hour === startDate.getHours())

        if (existingHour?.id) {
          await this.addVisit(inference.id, existingHour.id)
          // use UTC hours here to have constant increase even with daylight savings
          startDate.setUTCHours(startDate.getUTCHours() + 1)
          continue
        } else {
          await this.createHour(
            inference.trajectoryId,
            startDate.getDay(),
            startDate.getHours()
          )
        }
      }

      this.addVisit(
        inference.id,
        await this.getHourId(
          inference.trajectoryId,
          startDate.getDay(),
          startDate.getHours()
        )
      )

      // use UTC hours here to have constant increase even with daylight savings
      startDate.setUTCHours(startDate.getUTCHours() + 1)
    }
  }

  /** get all visited POI at the day and hour of the provided date */
  async getVisitsByDate(trajectoryId: string, date: Date): Promise<Visit[]> {
    const queryDay = date.getDay()
    const queryHour = date.getHours()

    return await this.sqliteService.getVisitsByDayAndHour(
      trajectoryId,
      queryDay,
      queryHour
    )
  }

  /** get the most frequently visited POI at the day and hour of the provided date */
  async getMostFrequentVisitByDate(
    trajectoryId: string,
    date: Date
  ): Promise<Visit> {
    const queryDay = date.getDay()
    const queryHour = date.getHours()

    return await this.sqliteService.getMostFrequentVisitByDayAndHour(
      trajectoryId,
      queryDay,
      queryHour
    )
  }
}
