import { Injectable } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { Inference } from 'src/app/model/inference'
import { TimetableEntry } from 'src/app/model/timetable'
import { AbstractBackgroundService } from '../background/AbstractBackgroundService'
import { BackgroundService } from '../background/background.service'
import { SqliteService } from '../db/sqlite.service'
import { FeatureFlagService } from '../feature-flag/feature-flag.service'
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
  protected isEnabled =
    this.featureFlagService.featureFlags.isTimetableComputationEnabled

  constructor(
    private sqliteService: SqliteService,
    private notificationService: NotificationService,
    private trajectoryService: TrajectoryService,
    private featureFlagService: FeatureFlagService,
    protected backgroundService: BackgroundService,
    private translateService: TranslateService
  ) {
    super(backgroundService, 'com.transistorsoft.timetableprediction')
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
        // only trigger notification if location has been visited at least two times
        if (nextVisit.count > 1) {
          const inference = await this.sqliteService.getInferenceById(
            nextVisit.inference
          )
          const title = this.translateService.instant(
            'notification.predictionTitle',
            { value: inference.addressDisplayName }
          )
          const text = this.translateService.instant(
            'notification.predictionText',
            { value: inference.addressDisplayName }
          )
          this.notificationService.notify(
            NotificationType.visitPrediction,
            title,
            text
          )
        }
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

  protected async backgroundFunction(): Promise<void> {
    this.predictUserTrackWithNotification()
    this.lastRunTime.next(this.lastTryTime.value)
  }
}
