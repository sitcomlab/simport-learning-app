import { Injectable } from '@angular/core'
import { Capacitor } from '@capacitor/core'
import BackgroundFetch from 'cordova-plugin-background-fetch'
import { BehaviorSubject } from 'rxjs'
import { Inference } from 'src/app/model/inference'
import { Hour, Visit, Weekday } from 'src/app/model/timetable'
import { SqliteService } from '../db/sqlite.service'
import { InferenceService } from '../inferences/inference.service'
import { NotificationService } from '../notification/notification.service'
import { NotificationType } from '../notification/types'
import { TrajectoryService } from '../trajectory/trajectory.service'

enum PredictionState {
  idle,
  foreground,
  background,
}

@Injectable({
  providedIn: 'root',
})
export class TimetableService {
  constructor(
    private sqliteService: SqliteService,
    private notificationService: NotificationService,
    private trajectoryService: TrajectoryService,
    private inferenceService: InferenceService
  ) {
    this.initBackgroundPrediction()
  }
  // 2 hours-interval for inference-generation via independent and limited background-fetch
  private static backgroundInterval = 120
  private static backgroundFetchId = 'com.transistorsoft.fetch'

  lastPredictionTryTime = new BehaviorSubject<number>(0)
  lastPredictionRunTime = new BehaviorSubject<number>(0)

  currentPredictionState = new BehaviorSubject<PredictionState>(
    PredictionState.idle
  )

  /**
   *
   * @param trajectoryId id of the trajectory
   * @returns next predicted visit or undefined
   */
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

  /**
   * Initialises the background-fetch events.
   * This is periodically run by the OS and additionally serves as a callback for custom scheduled fetches.
   */
  private async initBackgroundPrediction() {
    if (!Capacitor.isNative) return
    await BackgroundFetch.configure(
      {
        /**
         * The minimum interval in minutes to execute background fetch events.
         * Note: Background-fetch events will never occur at a frequency higher than every 15 minutes.
         * OS use a closed algorithm to adjust the frequency of fetch events, presumably based upon usage patterns of the app.
         * Therefore the actual fetch-interval is fully up to the OS,
         * fetch events can occur significantly less often than the configured minimumFetchInterval.
         */
        minimumFetchInterval: TimetableService.backgroundInterval,
        forceAlarmManager: true, // increases reliabilty for Android
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
      },
      async (taskId) => {
        // OS signalled that background-processing-time is available
        this.currentPredictionState.next(PredictionState.background)
        await this.predictWithNotification(undefined)
        BackgroundFetch.finish(taskId)
      },
      async (taskId) => {
        // OS signalled that the time for background-processing has expired
        this.currentPredictionState.next(PredictionState.idle)
        BackgroundFetch.finish(taskId)
      }
    )
  }

  async predictWithNotification(callback: () => Promise<void>) {
    try {
      this.trajectoryService
        .getFullUserTrack()
        .subscribe(async (trajectory) => {
          const nextVisit = await this.predictNextVisit(trajectory.id)
          if (nextVisit.count > 1) {
            const inference = await this.inferenceService.getInferenceById(
              nextVisit.inference
            )
            const title = `You will visit ${inference.name}`
            const text = `We think you will visit ${inference.name} in the next hour.`
            this.notificationService.notify(
              NotificationType.visitPrediction,
              title,
              text
            )
            this.lastPredictionRunTime.next(this.lastPredictionTryTime.value)
          }
        })
    } finally {
      this.currentPredictionState.next(PredictionState.idle)
      if (callback !== undefined) await callback()
    }
  }

  predictNextVisit(trajectoryId): Promise<Visit | undefined> {
    const date = new Date()
    date.setHours(date.getHours() + 1) // predict next hour
    const queryDay = date.getDay()
    const queryHour = date.getHours()

    try {
      return this.sqliteService.getMostFrequentVisitByDayAndHour(
        trajectoryId,
        queryDay,
        queryHour
      )
    } catch (e) {
      return undefined
    }
  }
}
