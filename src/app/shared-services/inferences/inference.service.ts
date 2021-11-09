import { Injectable, OnDestroy } from '@angular/core'
import { Trajectory, TrajectoryType } from 'src/app/model/trajectory'
import {
  AllInferences,
  HomeInference,
  POIInference,
  WorkInference,
} from 'src/app/shared-services/inferences/engine/definitions'
import { SimpleEngine } from './engine/simple-engine/simple-engine'
import { StaypointEngine } from './engine/staypoint-engine/staypoint-engine'
import { StaypointService } from '../staypoint/staypoint.service'
import { InferenceResult, InferenceResultStatus } from './engine/types'
import { TrajectoryService } from 'src/app/shared-services/trajectory/trajectory.service'
import { take } from 'rxjs/operators'
import { BehaviorSubject, Subject, Subscription } from 'rxjs'
import { NotificationService } from '../notification/notification.service'
import { NotificationType } from '../notification/types'
import { SqliteService } from '../db/sqlite.service'
import { LoadingController } from '@ionic/angular'
import { Plugins, Capacitor } from '@capacitor/core'
import BackgroundFetch from 'cordova-plugin-background-fetch'
import { Inference } from 'src/app/model/inference'
import { TimetableService } from '../timetable/timetable.service'

const { App, BackgroundTask } = Plugins

class InferenceFilterConfiguration {
  confidenceThreshold: number
  inferenceVisiblities: Map<string, boolean>
}

export enum InferenceServiceEvent {
  configureFilter = 'configureFilter',
  filterConfigurationChanged = 'filterConfigurationChanged',
}

enum InferenceGenerationState {
  idle,
  foreground,
  background,
}

@Injectable({
  providedIn: 'root',
})
export class InferenceService implements OnDestroy {
  // 12 hours-interval for inference-generation via location-updates
  private static foregroundInterval = 720
  // 2 hours-interval for inference-generation via independent and limited background-fetch
  private static backgroundInterval = 120
  private static backgroundFetchId = 'com.transistorsoft.fetch'

  private filterConfigSubscription: Subscription
  private loadingOverlay: HTMLIonLoadingElement = undefined

  lastInferenceTryTime = new BehaviorSubject<number>(0)
  lastInferenceRunTime = new BehaviorSubject<number>(0)

  currentGenerationState = new BehaviorSubject<InferenceGenerationState>(
    InferenceGenerationState.idle
  )
  private inferenceEngine: StaypointEngine | SimpleEngine
  // flag determines which inference engine to use
  readonly useStaypointEngine: boolean = true

  lastInferenceTime = new BehaviorSubject<number>(0)
  filterConfiguration = new BehaviorSubject<InferenceFilterConfiguration>({
    confidenceThreshold: 0.5,
    inferenceVisiblities: new Map([
      // show all inference-types by default
      ...Object.entries(AllInferences).map<[string, boolean]>(([_, value]) => [
        value.type,
        true,
      ]),
    ]),
  })

  inferenceServiceEvent = new Subject<InferenceServiceEvent>()

  constructor(
    private trajectoryService: TrajectoryService,
    private timetableService: TimetableService,
    private notificationService: NotificationService,
    private dbService: SqliteService,
    private loadingController: LoadingController,
    private staypointService: StaypointService
  ) {
    this.filterConfigSubscription = this.filterConfiguration.subscribe(
      async (_) => {
        this.triggerEvent(InferenceServiceEvent.filterConfigurationChanged)
      }
    )

    App.addListener('appStateChange', async (state) => {
      // the app changed state, update dialog-visibility
      await this.updateLoadingDialog()
      if (state.isActive) {
        // trigger inference-generation to ensure an up-to-date state of the app
        await this.triggerUserInferenceGenerationIfViable(false, true)
      }
    })
    this.initBackgroundInferenceGeneration()
    if (this.useStaypointEngine) {
      this.inferenceEngine = new StaypointEngine(
        this.staypointService,
        this.timetableService
      )
    } else {
      this.inferenceEngine = new SimpleEngine()
    }
  }

  ngOnDestroy() {
    this.filterConfigSubscription.unsubscribe()
  }

  triggerEvent(event: InferenceServiceEvent) {
    this.inferenceServiceEvent.next(event)
  }

  async generateInferences(
    trajectoryType: TrajectoryType,
    trajectoryId: string
  ): Promise<InferenceResult> {
    try {
      const trajectory = await this.trajectoryService
        .getOne(trajectoryType, trajectoryId)
        .pipe(take(1))
        .toPromise()
      return await this.generateInferencesForTrajectory(trajectory)
    } catch {
      return undefined
    }
  }

  async generateUserInferences(): Promise<InferenceResult> {
    try {
      const trajectory = await this.trajectoryService
        .getFullUserTrack()
        .pipe(take(1))
        .toPromise()
      return await this.generateInferencesForTrajectory(trajectory)
    } catch {
      return undefined
    }
  }

  async generateUserInferencesWithDialog(callback: () => Promise<void>) {
    try {
      await this.updateLoadingDialog()
      if (await this.generateUserInferences()) {
        this.lastInferenceRunTime.next(this.lastInferenceTryTime.value)
      }
    } finally {
      this.currentGenerationState.next(InferenceGenerationState.idle)
      await this.updateLoadingDialog()
      if (callback !== undefined) await callback()
    }
  }

  async generateInferencesForTrajectory(
    traj: Trajectory
  ): Promise<InferenceResult> {
    const inference = await this.inferenceEngine.infer(traj, [
      HomeInference,
      WorkInference,
      POIInference,
    ])

    await this.dbService.deleteInferences(traj.id)
    await this.dbService.upsertInference(inference.inferences)

    if (inference.status === InferenceResultStatus.successful) {
      // TODO: this is some artifical notification-content, which is subject to change
      const significantInferencesLength = inference.inferences.filter(
        (inf) =>
          inf.confidence > this.filterConfiguration.value.confidenceThreshold
      ).length
      if (significantInferencesLength > 0) {
        this.notificationService.notify(
          NotificationType.inferenceUpdate,
          'Inferences found',
          `We're now able to draw ${significantInferencesLength} conclusions from your location history`
        )
      }
    }

    return inference
  }

  async loadPersistedInferences(
    trajectoryId: string
  ): Promise<InferenceResult> {
    const filterConfig = this.filterConfiguration.value
    const inferences = (
      await this.dbService.getInferences(trajectoryId)
    ).filter((inf) => {
      return (
        inf.confidence >= filterConfig.confidenceThreshold &&
        filterConfig.inferenceVisiblities.has(inf.type) &&
        filterConfig.inferenceVisiblities.get(inf.type)
      )
    })
    const persisted: InferenceResult = {
      status: InferenceResultStatus.successful,
      inferences,
    }
    return persisted
  }

  /**
   * get inference by id
   * @param inferenceId id of the inference
   * @returns Inference or undefined if inference could not be found
   */
  async getInferenceById(inferenceId: string): Promise<Inference> {
    return await this.dbService.getInferenceById(inferenceId)
  }

  // background inference updates

  /**
   * Triggers the generation of user inference, if viable.
   * Viability is decided by:
   * - schedule
   * - concurrency
   *
   * @param runAsFetch run inference generation as fetch, which runs in background, but is less reliable
   *                   if undefined, this is decided by the app-state (active/inactive)
   * @param referToLastRun flag whether schedule references to timestamp of last run or last attempt
   */
  async triggerUserInferenceGenerationIfViable(
    runAsFetch?: boolean,
    referToLastRun: boolean = false
  ) {
    if (this.currentGenerationState.value !== InferenceGenerationState.idle) {
      return
    }
    runAsFetch ??= !(await App.getState()).isActive
    const lastRun = referToLastRun
      ? this.lastInferenceRunTime.value
      : this.lastInferenceTryTime.value
    if (runAsFetch && Capacitor.isNative) {
      this.triggerUserInferenceGenerationAsFetch(lastRun)
    } else {
      await this.triggerUserInferenceGenerationAsTask(lastRun)
    }
  }

  /**
   * Triggers inference-generation as a background fetch (if viable).
   * Fetches are executed as background processes, thus enabling the inferences to update seamlessly.
   * But: they are not reliable, since completely and very strictly managed by the OS.
   *
   * @param lastRunTime last run time that is taken as reference for verifying the schedule.
   */
  private triggerUserInferenceGenerationAsFetch(lastRunTime: number) {
    if (
      this.isWithinSchedule(InferenceService.backgroundInterval, lastRunTime)
    ) {
      this.lastInferenceTryTime.next(new Date().getTime())
      BackgroundFetch.scheduleTask({
        taskId: InferenceService.backgroundFetchId,
        delay: 1000, // schedule to run in one second
      })
    }
  }

  /**
   * Triggers inference-generation as a background task (if viable).
   * This task is usually started in foreground, but lives on for a small period of time
   * (~30 seconds) after the app becomes inactive.
   *
   * @param lastRunTime last run time that is taken as reference for verifying the schedule.
   */
  private async triggerUserInferenceGenerationAsTask(lastRunTime: number) {
    if (
      this.isWithinSchedule(InferenceService.foregroundInterval, lastRunTime)
    ) {
      this.lastInferenceTryTime.next(new Date().getTime())
      const taskId = BackgroundTask.beforeExit(async () => {
        const callback: () => Promise<void> = async () => {
          BackgroundTask.finish({
            taskId,
          })
        }
        this.currentGenerationState.next(InferenceGenerationState.foreground)
        await this.generateUserInferencesWithDialog(callback)
      })
    }
  }

  /**
   * Initialises the background-fetch events.
   * This is periodically run by the OS and additionally serves as a callback for custom scheduled fetches.
   */
  private async initBackgroundInferenceGeneration() {
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
        minimumFetchInterval: InferenceService.backgroundInterval,
        forceAlarmManager: true, // increases reliabilty for Android
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
      },
      async (taskId) => {
        // OS signalled that background-processing-time is available
        this.currentGenerationState.next(InferenceGenerationState.background)
        await this.generateUserInferencesWithDialog(undefined)
        BackgroundFetch.finish(taskId)
      },
      async (taskId) => {
        // OS signalled that the time for background-processing has expired
        this.currentGenerationState.next(InferenceGenerationState.idle)
        BackgroundFetch.finish(taskId)
      }
    )
  }

  // helper methods

  private isWithinSchedule(interval: number, reference: number): boolean {
    const timestamp = new Date().getTime()
    const diffInMinutes = (timestamp - reference) / 1000 / 60
    return diffInMinutes > interval
  }

  private async updateLoadingDialog() {
    if (
      this.currentGenerationState.value === InferenceGenerationState.foreground
    ) {
      await this.showLoadingDialog()
    } else {
      await this.hideLoadingDialog()
    }
  }

  private async showLoadingDialog() {
    if (!this.loadingOverlay) {
      this.loadingOverlay = await this.loadingController.create({
        message: 'Generating inferences from your location history …',
        translucent: true,
      })
      await this.loadingOverlay.present()
    }
  }

  private async hideLoadingDialog() {
    if (this.loadingOverlay) {
      await this.loadingOverlay.dismiss()
      this.loadingOverlay = undefined
    }
  }
}
