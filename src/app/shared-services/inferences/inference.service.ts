import { Injectable, OnDestroy } from '@angular/core'
import { Trajectory, TrajectoryType } from 'src/app/model/trajectory'
import {
  AllInferences,
  HomeInference,
  WorkInference,
} from 'src/app/shared-services/inferences/engine/definitions'
import { SimpleEngine } from './engine/simple-engine'
import { InferenceResult, InferenceResultStatus } from './engine/types'
import { TrajectoryService } from 'src/app/shared-services/trajectory/trajectory.service'
import { take } from 'rxjs/operators'
import { BehaviorSubject, Subject, Subscription } from 'rxjs'
import { NotificationService } from '../notification/notification.service'
import { NotificationType } from '../notification/types'
import { SqliteService } from '../db/sqlite.service'
import { LoadingController } from '@ionic/angular'
import BackgroundFetch from 'cordova-plugin-background-fetch'
import { Plugins } from '@capacitor/core'

const { App, BackgroundTask } = Plugins

export enum InferenceServiceEvent {
  configureFilter = 'configureFilter',
  filterConfigurationChanged = 'filterConfigurationChanged',
}

export class InferenceFilterConfiguration {
  confidenceThreshold: number
  inferenceVisiblities: Map<string, boolean>
}

export enum InferenceRunningState {
  idle,
  foreground,
  background,
}

@Injectable({
  providedIn: 'root',
})
export class InferenceService implements OnDestroy {
  // 24 hours-interval for inference-generation via location-updates
  private static inferenceIntervalMinutes = 1440
  // 2 hours-interval for inference-generation via independent and limited background-fetch
  private static inferenceBackgroundFetchIntervalMinutes = 120
  private static backgroundFetchId = 'com.transistorsoft.fetch'

  private inferenceEngine = new SimpleEngine()
  private filterConfigSubscription: Subscription
  private loadingOverlay: HTMLIonLoadingElement = undefined

  isGeneratingInferences = new BehaviorSubject<InferenceRunningState>(
    InferenceRunningState.idle
  )
  lastInferenceTryTime = new BehaviorSubject<number>(0)
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
    private notificationService: NotificationService,
    private dbService: SqliteService,
    private loadingController: LoadingController
  ) {
    this.filterConfigSubscription = this.filterConfiguration.subscribe(
      async (_) => {
        this.triggerEvent(InferenceServiceEvent.filterConfigurationChanged)
      }
    )

    App.addListener('appStateChange', async (state) => {
      if (state.isActive) {
        // the app became active, update dialog-visibility
        await this.updateLoadingDialog()
        // trigger inference-generation to ensure an up-to-date state of the app
        await this.triggerUserInferenceGenerationIfViable(false)
      }
    })
    this.initBackgroundInferenceGeneration()
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
    const traj = await this.trajectoryService
      .getOne(trajectoryType, trajectoryId)
      .pipe(take(1))
      .toPromise()

    return this.generateInferencesForTrajectory(traj)
  }

  async generateInferencesForTrajectory(
    traj: Trajectory
  ): Promise<InferenceResult> {
    const inference = this.inferenceEngine.infer(traj, [
      HomeInference,
      WorkInference,
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

  private async generateUserInference(): Promise<InferenceResult> {
    const trajectory = await this.trajectoryService
      .getFullUserTrack()
      .pipe(take(1))
      .toPromise()
    const inferenceResult = await this.generateInferencesForTrajectory(
      trajectory
    )

    // TODO: persist generated inferences
    return inferenceResult
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

  // background inference updates

  async triggerUserInferenceGenerationIfViable(runAsBackgroundFetch: boolean) {
    if (runAsBackgroundFetch === undefined) {
      const appState = await App.getState()
      runAsBackgroundFetch = !appState.isActive
    }
    if (this.isGeneratingInferences.value !== InferenceRunningState.idle) {
      return
    }
    if (runAsBackgroundFetch) {
      if (
        this.isWithinInferenceSchedule(
          InferenceService.inferenceBackgroundFetchIntervalMinutes
        )
      ) {
        this.lastInferenceTryTime.next(new Date().getTime())
        BackgroundFetch.scheduleTask({
          taskId: InferenceService.backgroundFetchId,
          delay: 1000, // schedule to run in one second
        })
      }
    } else {
      if (
        this.isWithinInferenceSchedule(
          InferenceService.inferenceIntervalMinutes
        )
      ) {
        this.lastInferenceTryTime.next(new Date().getTime())
        const taskId = BackgroundTask.beforeExit(async () => {
          const callback: () => Promise<void> = async () => {
            BackgroundTask.finish({
              taskId,
            })
          }
          this.isGeneratingInferences.next(InferenceRunningState.foreground)
          await this.generateUserInferences(callback)
        })
      }
    }
  }

  private async generateUserInferences(callback: () => Promise<void>) {
    try {
      await this.updateLoadingDialog()
      await this.generateUserInference()
      this.isGeneratingInferences.next(InferenceRunningState.idle)
      await this.updateLoadingDialog()
    } finally {
      if (callback !== undefined) await callback()
    }
  }

  private async initBackgroundInferenceGeneration() {
    const status = await BackgroundFetch.configure(
      {
        /**
         * The minimum interval in minutes to execute background fetch events.
         * Note: Background-fetch events will never occur at a frequency higher than every 15 minutes.
         * Apple uses a closed algorithm to adjust the frequency of fetch events, presumably based upon usage patterns of the app.
         * Fetch events can occur significantly less often than the configured minimumFetchInterval.
         */
        minimumFetchInterval:
          InferenceService.inferenceBackgroundFetchIntervalMinutes,
        forceAlarmManager: true,
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
      },
      async (taskId) => {
        this.isGeneratingInferences.next(InferenceRunningState.background)
        await this.generateUserInferences(undefined)
        BackgroundFetch.finish(taskId)
      },
      async (taskId) => {
        // OS signalled that the remaining background-time has expired
        this.isGeneratingInferences.next(InferenceRunningState.idle)
        BackgroundFetch.finish(taskId)
      }
    )

    // Checking BackgroundFetch status:
    if (status !== BackgroundFetch.STATUS_AVAILABLE) {
      if (status === BackgroundFetch.STATUS_DENIED) {
        console.log(
          'The user explicitly disabled background behavior for this app or for the whole system.'
        )
      } else if (status === BackgroundFetch.STATUS_RESTRICTED) {
        console.log(
          'Background updates are unavailable and the user cannot enable them again.'
        )
      }
    }
  }

  // helper methods

  private isWithinInferenceSchedule(interval: number): boolean {
    const timestamp = new Date().getTime()
    const diffInMinutes =
      (timestamp - this.lastInferenceTryTime.value) / 1000 / 60
    return diffInMinutes > interval
  }

  private async updateLoadingDialog() {
    if (
      this.isGeneratingInferences.value === InferenceRunningState.foreground
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
