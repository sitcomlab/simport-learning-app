import { Inference } from 'src/app/model/inference'
import { StayPoints } from 'src/app/model/staypoints'
import { Trajectory } from 'src/app/model/trajectory'
import {
  IInferenceEngine,
  InferenceDefinition,
  InferenceResult,
  InferenceResultStatus,
  InferenceType,
} from '../types'
import { NightnessScoring } from '../../scoring/nightness-scoring'
import { IInferenceScoring } from '../../scoring/types'
import { WorkHoursScoring } from '../../scoring/work-hours-scoring'
import { StaypointDetector } from 'src/app/shared-services/staypoint/staypoint-detector'
import {
  inferHomeFromStayPoints,
  inferWorkFromStayPoints,
} from 'src/app/shared-services/staypoint/utils'

export class StaypointEngine implements IInferenceEngine {
  scorings: IInferenceScoring[] = [
    new NightnessScoring(),
    new WorkHoursScoring(),
  ]

  private staypointDetector: StaypointDetector = new StaypointDetector()
  private DIST_TRESHOLD_METERS = 150
  private TIME_TRESHOLD_MINUTES = 15

  private inputCoordinatesLimit = 100000

  infer(
    trajectory: Trajectory,
    inferences: InferenceDefinition[]
  ): InferenceResult {
    if (trajectory.coordinates.length > this.inputCoordinatesLimit) {
      return {
        status: InferenceResultStatus.tooManyCoordinates,
        inferences: [],
      }
    }

    if (trajectory.coordinates.length === 0) {
      return {
        status: InferenceResultStatus.noInferencesFound,
        inferences: [],
      }
    }

    const stayPointData = this.staypointDetector.detectStayPoints(
      trajectory,
      this.DIST_TRESHOLD_METERS,
      this.TIME_TRESHOLD_MINUTES
    )

    const stayPoints: StayPoints = {
      trajID: trajectory.id,
      coordinates: stayPointData.coordinates,
      starttimes: stayPointData.starttimes,
      endtimes: stayPointData.endtimes,
    }

    const inferenceResults = inferences
      .map((i) => {
        if (i.type === InferenceType.home) {
          const inference = inferHomeFromStayPoints(stayPoints)
          if (inference) return inference
        }
        if (i.type === InferenceType.work) {
          const inference = inferWorkFromStayPoints(stayPoints)
          if (inference) return inference
        }
      })
      .filter((i) => i) // filter undefined values

    return {
      status:
        inferenceResults.length === 0
          ? InferenceResultStatus.noInferencesFound
          : InferenceResultStatus.successful,
      inferences: inferenceResults,
    }
  }
}
