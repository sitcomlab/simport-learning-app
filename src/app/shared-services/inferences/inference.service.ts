import { Injectable } from '@angular/core'
import { Inference } from 'src/app/model/inference'
import { TrajectoryType } from 'src/app/model/trajectory'
import { HomeInference, WorkInference } from './engine/definitions'
import { SimpleEngine } from './engine/simple-engine'
import {
  InferenceResult,
  InferenceType,
} from 'src/app/shared-services/inferences/types'
import { TrajectoryService } from 'src/app/shared-services/trajectory.service'
import { take } from 'rxjs/operators'

@Injectable({
  providedIn: 'root',
})
export class InferenceService {
  private inferences: Inference[] = [
    {
      name: 'Home',
      type: InferenceType.home,
      description: 'We do now know where your home is.',
      trajectoryId: 'muenster',
      lonLat: [51.968446, 7.60549],
      accuracy: 50,
    },
    {
      name: 'Workplace',
      type: InferenceType.work,
      description: 'We know where you work.',
      lonLat: [51.968446, 7.61249],
      trajectoryId: 'muenster',
      accuracy: 50,
    },
  ]
  private inferenceEngine = new SimpleEngine()

  constructor(private trajectoryService: TrajectoryService) {}

  getInferences(trajectoryId: string): Inference[] {
    return this.inferences.filter((i) => i.trajectoryId === trajectoryId)
  }

  /**
   * TODO: this is used for testing purposes only
   * and should not be merged onto primary branches
   */
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
}
