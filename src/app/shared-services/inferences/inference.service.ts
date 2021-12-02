import { Injectable, OnDestroy } from '@angular/core'
import { Trajectory, TrajectoryType, Point } from 'src/app/model/trajectory'
import {
  AllInferences,
  HomeInference,
  POIInference,
  WorkInference,
} from 'src/app/shared-services/inferences/engine/definitions'
import { SimpleEngine } from './engine/simple-engine/simple-engine'
import { StaypointEngine } from './engine/staypoint-engine/staypoint-engine'
import { StaypointService } from '../staypoint/staypoint.service'
import {
  InferenceResult,
  InferenceResultStatus,
  InferenceType,
} from './engine/types'
import { TrajectoryService } from 'src/app/shared-services/trajectory/trajectory.service'
import { take } from 'rxjs/operators'
import { BehaviorSubject, Subject, Subscription } from 'rxjs'
import { NotificationService } from '../notification/notification.service'
import { NotificationType } from '../notification/types'
import { SqliteService } from '../db/sqlite.service'
import { LoadingController } from '@ionic/angular'
import { Plugins } from '@capacitor/core'
import { Inference } from 'src/app/model/inference'
import { TimetableService } from '../timetable/timetable.service'
import { ReverseGeocodingService } from '../reverse-geocoding/reverse-geocoding.service'
import { AbstractBackgroundService } from '../background/AbstractBackgroundService'
import {
  BackgroundService,
  BackgroundState,
} from '../background/background.service'

const { App } = Plugins

class InferenceFilterConfiguration {
  confidenceThreshold: number
  inferenceVisiblities: Map<string, boolean>
}

export enum InferenceServiceEvent {
  configureFilter = 'configureFilter',
  filterConfigurationChanged = 'filterConfigurationChanged',
  inferencesUpdated = 'inferencesUpdated',
}

@Injectable({
  providedIn: 'root',
})
export class InferenceService
  extends AbstractBackgroundService
  implements OnDestroy
{
  protected backgroundFetchId = 'com.transistorsoft.fetch'
  protected foregroundInterval = 720
  protected backgroundInterval = 120

  private filterConfigSubscription: Subscription
  private loadingOverlay: HTMLIonLoadingElement = undefined

  private inferenceEngine: StaypointEngine | SimpleEngine
  // flag determines which inference engine to use
  readonly useStaypointEngine: boolean = true

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
    private geocodingService: ReverseGeocodingService,
    private loadingController: LoadingController,
    private staypointService: StaypointService,
    protected backgroundService: BackgroundService
  ) {
    super(backgroundService, 'com.transistorsoft.fetch')

    this.filterConfigSubscription = this.filterConfiguration.subscribe(
      async (_) => {
        this.triggerEvent(InferenceServiceEvent.filterConfigurationChanged)
      }
    )

    App.addListener('appStateChange', async (state) => {
      // the app changed state, update dialog-visibility
      await this.updateLoadingDialog()
    })
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

  protected async backgroundFuction(): Promise<void> {
    try {
      await this.updateLoadingDialog()
      await this.generateUserInferences()
    } finally {
      await this.updateLoadingDialog()
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

    // filter POIs
    const poiInferences = inference.inferences.filter(
      (i) => i.type === InferenceType.poi
    )
    await this.timetableService.createAndSaveTimetable(poiInferences, traj.id)

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

    await this.geocodingService.reverseGeocodeInferences(inference.inferences)

    return inference
  }

  async loadPersistedInferences(
    trajectoryId: string,
    runGeocoding: boolean = false
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
    if (runGeocoding) {
      this.geocodingService.reverseGeocodeInferences(inferences).then((_) => {
        this.triggerEvent(InferenceServiceEvent.inferencesUpdated)
      })
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

  // helper methods

  private async updateLoadingDialog() {
    if (
      this.backgroundService.currentBackgroundState.value ===
      BackgroundState.foreground
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
