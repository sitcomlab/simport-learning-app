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
import { Plugins } from '@capacitor/core'
import { LoadingController } from '@ionic/angular'

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
  private static inferenceIntervalMinutes = 240 // 4 hours
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

  async generateUserInference(): Promise<InferenceResult> {
    const time = new Date().getTime()
    this.lastInferenceTime.next(time)
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

  private isWithinInferenceSchedule(): boolean {
    const timestamp = new Date().getTime()
    const diffInMinutes = (timestamp - this.lastInferenceTime.value) / 1000 / 60
    return diffInMinutes > InferenceService.inferenceIntervalMinutes
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
