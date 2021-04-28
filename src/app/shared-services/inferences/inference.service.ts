import { Injectable } from '@angular/core'
import { TrajectoryType } from 'src/app/model/trajectory'
import {
  HomeInference,
  WorkInference,
} from 'src/app/shared-services/inferences/engine/definitions'
import { SimpleEngine } from './engine/simple-engine'
import { InferenceResult, InferenceResultStatus } from './types'
import { TrajectoryService } from 'src/app/shared-services/trajectory.service'
import { take } from 'rxjs/operators'
import { BehaviorSubject } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class InferenceService {
  private static inferenceIntervalMinutes = 240 // 4 hours
  private inferenceEngine = new SimpleEngine()
  lastInferenceTime: BehaviorSubject<number> = new BehaviorSubject<number>(0)

  constructor(private trajectoryService: TrajectoryService) {}

  async generateInferences(
    trajectoryType: TrajectoryType,
    trajectoryId: string
  ): Promise<InferenceResult> {
    const traj = await this.trajectoryService
      .getOne(trajectoryType, trajectoryId)
      .pipe(take(1))
      .toPromise()
    return this.inferenceEngine.infer(traj, [HomeInference, WorkInference])
  }

  async generateUserInference(): Promise<InferenceResult> {
    const time = new Date().getTime()
    if (this.isWithinInterval(time)) return

    this.lastInferenceTime.next(time)
    const trajectory = await this.trajectoryService
      .getFullUserTrack()
      .pipe(take(1))
      .toPromise()
    const inferenceResult = await this.generateInferences(
      trajectory.type,
      trajectory.id
    )

    // TODO: persist generated inferences
    return inferenceResult
  }

  private isWithinInterval(timestamp: number): boolean {
    const diffInMinutes = (timestamp - this.lastInferenceTime.value) / 1000 / 60
    return diffInMinutes < InferenceService.inferenceIntervalMinutes
  }

  loadPersistedInferences(trajectoryId: string): InferenceResult {
    // TODO: actually load persisted inferences
    const emptyResult: InferenceResult = {
      status: InferenceResultStatus.successful,
      inferences: [],
    }
    return emptyResult
  }
}
