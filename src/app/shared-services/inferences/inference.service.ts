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

@Injectable({
  providedIn: 'root',
})
export class InferenceService implements OnDestroy {
  // 8 hours-interval for inference-generation via location-updates
  private static inferenceIntervalMinutes = 480
  // 24 hours-interval for inference-generation via independent and limited background-fetch
  private static inferenceBackgroundFetchIntervalMinutes = 1440

  private inferenceEngine = new SimpleEngine()
  private filterConfigSubscription: Subscription
  private loadingOverlay: HTMLIonLoadingElement = undefined
  private isGeneratingInferences = false

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
    this.lastInferenceTime.next(new Date().getTime())

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

  triggerUserInferenceGenerationIfViable() {
    if (this.isWithinInferenceSchedule() && !this.isGeneratingInferences) {
      this.isGeneratingInferences = true
      const taskId = BackgroundTask.beforeExit(async () => {
        await this.updateLoadingDialog()
        await this.generateUserInference().finally(async () => {
          this.isGeneratingInferences = false
          await this.updateLoadingDialog()
          BackgroundTask.finish({
            taskId,
          })
        })
      })
    }
  }

  private async initBackgroundInferenceGeneration() {
    const status = await BackgroundFetch.configure(
      {
        minimumFetchInterval:
          InferenceService.inferenceBackgroundFetchIntervalMinutes,
      },
      async (taskId) => {
        // OS has granted background-time, perform inference-generation if viable
        if (this.isWithinInferenceSchedule() && !this.isGeneratingInferences) {
          this.isGeneratingInferences = true
          await this.generateUserInference()
          this.isGeneratingInferences = false
        }
        BackgroundFetch.finish(taskId)
      },
      async (taskId) => {
        // OS signalled that the remaining background-time has expired
        this.isGeneratingInferences = false
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

  private isWithinInferenceSchedule(): boolean {
    const timestamp = new Date().getTime()
    const diffInMinutes = (timestamp - this.lastInferenceTime.value) / 1000 / 60
    return diffInMinutes > InferenceService.inferenceIntervalMinutes
  }

  private async updateLoadingDialog() {
    if (this.isGeneratingInferences) {
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
