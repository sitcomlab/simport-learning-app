import { Injectable } from '@angular/core'
import { Capacitor } from '@capacitor/core'
import BackgroundFetch from 'cordova-plugin-background-fetch'
import { BehaviorSubject } from 'rxjs'
import { Inference } from 'src/app/model/inference'
import { TimetableEntry } from 'src/app/model/timetable'
import { SqliteService } from '../db/sqlite.service'
import { NotificationService } from '../notification/notification.service'
import { NotificationType } from '../notification/types'
import { TrajectoryService } from '../trajectory/trajectory.service'
import { Timetable } from './timetable'

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
    private trajectoryService: TrajectoryService
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

  async createAndSaveTimetable(
    inferences: Inference[],
    trajectoryId: string
  ): Promise<void> {
    const timetable = new Timetable()
    inferences.forEach((inference) => {
      if (inference.onSiteTimes) {
        timetable.addPoi(inference.id, inference.onSiteTimes)
      }
    })
    const timetableEntries = timetable.toList()
    this.sqliteService.upsertTimetable(timetableEntries, trajectoryId)
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
        await this.predictUserTrackWithNotification(undefined)
        BackgroundFetch.finish(taskId)
      },
      async (taskId) => {
        // OS signalled that the time for background-processing has expired
        this.currentPredictionState.next(PredictionState.idle)
        BackgroundFetch.finish(taskId)
      }
    )
  }

  /**
   * @description predicts upcoming poi visit and triggers a new notification when a prediction was found
   * @param callback callback function
   */
  async predictUserTrackWithNotification(callback: () => Promise<void>) {
    try {
      this.trajectoryService
        .getFullUserTrack()
        .subscribe(async (trajectory) => {
          const nextVisits = await this.predictNextVisit(trajectory.id)
          nextVisits.forEach(async (nextVisit) => {
            if (nextVisit.count > 1) {
              const inference = await this.sqliteService.getInferenceById(
                nextVisit.inference
              )
              const title = `You will visit ${inference.name}`
              const text = `We think you will visit ${inference.name} in the next hour.`
              this.notificationService.notify(
                NotificationType.visitPrediction,
                title,
                text
              )
            }
            this.lastPredictionRunTime.next(this.lastPredictionTryTime.value)
          })
        })
    } finally {
      this.currentPredictionState.next(PredictionState.idle)
      if (callback !== undefined) await callback()
    }
  }

  predictNextVisit(trajectoryId: string): Promise<TimetableEntry[]> {
    const date = new Date()
    date.setHours(date.getHours() + 1) // predict next hour
    const queryDay = date.getDay()
    const queryHour = date.getHours()

    return this.sqliteService.getMostFrequentVisitByDayAndHour(
      trajectoryId,
      queryDay,
      queryHour
    )
  }

  async getTimetable(trajectoryId: string): Promise<TimetableEntry[]> {
    return await this.sqliteService.getTimetable(trajectoryId)
  }
}
