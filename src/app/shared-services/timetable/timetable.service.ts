import { Injectable } from '@angular/core'
import { Inference } from 'src/app/model/inference'
import { TimetableEntry } from 'src/app/model/timetable'
import { AbstractBackgroundService } from '../background/AbstractBackgroundService'
import { BackgroundService } from '../background/background.service'
import { SqliteService } from '../db/sqlite.service'
import { NotificationService } from '../notification/notification.service'
import { NotificationType } from '../notification/types'
import { TrajectoryService } from '../trajectory/trajectory.service'
import { Timetable } from './timetable'

@Injectable({
  providedIn: 'root',
})
export class TimetableService extends AbstractBackgroundService {
  protected foregroundInterval = 720
  protected backgroundInterval = 15
  protected backgroundFetchId = 'com.transistorsoft.timetableprediction'

  constructor(
    private sqliteService: SqliteService,
    private notificationService: NotificationService,
    private trajectoryService: TrajectoryService,
    protected backgroundService: BackgroundService
  ) {
    super(backgroundService, 'com.transistorsoft.timetableprediction')
  }

  protected async backgroundFuction(): Promise<void> {
    this.predictUserTrackWithNotification()
    this.lastRunTime.next(this.lastTryTime.value)
  }

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
   * @description predicts upcoming poi visit and triggers a new notification when a prediction was found
   * @param callback callback function
   */
  async predictUserTrackWithNotification() {
    this.trajectoryService.getFullUserTrack().subscribe(async (trajectory) => {
      const nextVisits = await this.predictNextVisit(trajectory.id)
      nextVisits.forEach(async (nextVisit) => {
        // TODO just for development, uncomment in production
        // if (nextVisit.count > 1) {
        const inference = await this.sqliteService.getInferenceById(
          nextVisit.inference
        )
        const title = `You will visit ${inference.addressDisplayName}`
        const text = `We think you will visit ${inference.addressDisplayName} in the next hour.`
        this.notificationService.notify(
          NotificationType.visitPrediction,
          title,
          text
        )
        // }
      })
    })
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
