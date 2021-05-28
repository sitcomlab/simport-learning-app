import { Injectable } from '@angular/core'
import { Trajectory, TrajectoryType } from 'src/app/model/trajectory'
import {
  HomeInference,
  WorkInference,
} from 'src/app/shared-services/inferences/engine/definitions'
import { SimpleEngine } from './engine/simple-engine'
import { InferenceResult, InferenceResultStatus } from './engine/types'
import { TrajectoryService } from 'src/app/shared-services/trajectory/trajectory.service'
import { take } from 'rxjs/operators'
import { BehaviorSubject } from 'rxjs'
import { NotificationService } from '../notification/notification.service'
import { NotificationType } from '../notification/types'
import { SqliteService } from '../db/sqlite.service'

@Injectable({
  providedIn: 'root',
})
export class InferenceService {
  public static inferenceConfidenceThreshold = 0.5
  private static inferenceIntervalMinutes = 240 // 4 hours
  private inferenceEngine = new SimpleEngine()
  lastInferenceTime: BehaviorSubject<number> = new BehaviorSubject<number>(0)

  constructor(
    private trajectoryService: TrajectoryService,
    private notificationService: NotificationService,
    private dbService: SqliteService
  ) {}

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
        (inf) => inf.confidence > InferenceService.inferenceConfidenceThreshold
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

  isWithinInferenceSchedule(): boolean {
    const timestamp = new Date().getTime()
    const diffInMinutes = (timestamp - this.lastInferenceTime.value) / 1000 / 60
    return diffInMinutes > InferenceService.inferenceIntervalMinutes
  }

  async loadPersistedInferences(
    trajectoryId: string
  ): Promise<InferenceResult> {
    const inferences = await this.dbService.getInferences(trajectoryId)
    const persisted: InferenceResult = {
      status: InferenceResultStatus.successful,
      inferences,
    }
    return persisted
  }
}
