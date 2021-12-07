import { Inference } from 'src/app/model/inference'
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
import { StaypointService } from 'src/app/shared-services/staypoint/staypoint.service'
import { StayPointCluster } from 'src/app/model/staypoints'
import concaveman from 'concaveman'

export class StaypointEngine implements IInferenceEngine {
  scorings: IInferenceScoring[] = [
    new NightnessScoring(),
    new WorkHoursScoring(),
  ]

  constructor(private staypointService: StaypointService) {}

  private inputCoordinatesLimit = 100000

  async infer(
    trajectory: Trajectory,
    inferences: InferenceDefinition[]
  ): Promise<InferenceResult> {
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

    const daysInTrajectory = this.countDays(trajectory)
    const weekDaysInTrajectory = this.countWeekDays(trajectory)

    await this.staypointService.updateStayPoints(trajectory.type, trajectory.id)
    const stayPoints = await this.staypointService.getStayPoints(trajectory.id)
    const stayPointClusters =
      await this.staypointService.computeStayPointClusters(stayPoints)

    const inferenceResultsNested = inferences.map((i) => {
      if (i.type === InferenceType.home) {
        return this.inferHomeFromStayPointClusters(
          stayPointClusters,
          daysInTrajectory
        )
      }
      if (i.type === InferenceType.work) {
        return this.inferWorkFromStayPointClusters(
          stayPointClusters,
          weekDaysInTrajectory
        )
      }
      if (i.type === InferenceType.poi) {
        return this.inferPOIFromStayPointClusters(stayPointClusters)
      }
    })
    // flatten and filter
    let inferenceResults: Inference[] = [].concat
      .apply([], inferenceResultsNested)
      .filter((i) => i)

    // top home and work inference should not be listed as POIs
    inferenceResults =
      this.removePOIInferenceCorrespondingToTopHomeAndWorkInference(
        inferenceResults
      )

    return {
      status:
        inferenceResults.length === 0
          ? InferenceResultStatus.noInferencesFound
          : InferenceResultStatus.successful,
      inferences: inferenceResults,
    }
  }

  private removePOIInferenceCorrespondingToTopHomeAndWorkInference(
    inferences: Inference[]
  ): Inference[] {
    // takes array of all inferences, returning all inferences except POI-inferences on same location as top home and work inference
    const homeInferences = inferences.filter(
      (inference) => inference.type === InferenceType.home
    )
    if (homeInferences.length > 0) {
      const topHomeInference = homeInferences.reduce((prev, curr) => {
        return prev.confidence > curr.confidence ? prev : curr
      })
      inferences = inferences.filter((inference) => {
        return (
          inference.type !== InferenceType.poi ||
          inference.latLng !== topHomeInference.latLng
        )
      })
    }
    const workInferences = inferences.filter(
      (inference) => inference.type === InferenceType.work
    )
    if (workInferences.length > 0) {
      const topWorkInference = workInferences.reduce((prev, curr) => {
        return prev.confidence > curr.confidence ? prev : curr
      })
      inferences = inferences.filter((inference) => {
        return (
          inference.type !== InferenceType.poi ||
          inference.latLng !== topWorkInference.latLng
        )
      })
    }
    return inferences
  }

  private countDays(trajectory: Trajectory): number {
    // TODO update this method when start/stop are encoded in trajectory
    const diffMs =
      trajectory.timestamps[trajectory.timestamps.length - 1].getTime() -
      trajectory.timestamps[0].getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    // we round up as half a day can also get counted as a work/home day in scoring
    return Math.floor(diffDays) + 1
  }

  private countWeekDays(trajectory: Trajectory): number {
    // TODO update this method when start/stop are encoded in trajectory
    let count = 0
    const endDate = new Date(
      trajectory.timestamps[trajectory.timestamps.length - 1].getTime()
    )
    const currentDate = new Date(trajectory.timestamps[0].getTime())
    while (currentDate <= endDate) {
      if (!(currentDate.getDay() in [0, 6])) count += 1
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return count
  }

  /**
   * Get the location of the three clusters of staypoints where the most nights (12pm to 4am) were spent.
   * @param stayPointClusters The clusters of staypoints from which home location is to be extracted
   * @param daysInTrajectory The number of days for which the trajectory has been recorded,
   * used to calculate the "confidence" value (number of nights spent at staypoint/number of days in trajectory)
   * @return The top three home inferences
   */
  private inferHomeFromStayPointClusters(
    stayPointClusters: StayPointCluster[],
    daysInTrajectory: number
  ): Inference[] {
    if (stayPointClusters === undefined || stayPointClusters.length === 0) {
      return undefined
    }
    const clusterScores = stayPointClusters.map((stayPointCluster) => {
      return this.calculateHomeScore(stayPointCluster)
    })
    // here we return inferences for all clusters
    if (stayPointClusters.length <= 3) {
      return clusterScores
        .map((score, index) => {
          return this.createInferenceForCluster(
            InferenceType.home,
            stayPointClusters[index],
            score,
            daysInTrajectory
          )
        })
        .sort((a, b) => b.confidence - a.confidence)
    }
    // if more than three clusters, we return only inferences of top three results
    const topThreeInferenceIndices =
      this.getIndicesOfThreeMaxValues(clusterScores)
    return topThreeInferenceIndices
      .map((topInferenceIndex) => {
        return this.createInferenceForCluster(
          InferenceType.home,
          stayPointClusters[topInferenceIndex],
          clusterScores[topInferenceIndex],
          daysInTrajectory
        )
      })
      .sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Get the location of the three clusters of staypoints where the most workdays were spent.
   * Each interval from 10am to 12am and from 2pm to 4pm on Mon-Fri contained within staypoint is counted.
   * @param stayPointClusters The staypoint clusters from which work location is to be extracted
   * @param weekDaysInTrajectory The number of working days (Mon-Fri) for which the trajectory has been recorded,
   * used to calculate the "confidence" value (number of full days worked/number of week days in trajectory)
   * @return The top three work inferences
   */
  private inferWorkFromStayPointClusters(
    stayPointClusters: StayPointCluster[],
    weekDaysInTrajectory: number
  ): Inference[] {
    if (stayPointClusters === undefined || stayPointClusters.length === 0)
      return undefined
    const clusterScores = stayPointClusters.map((stayPointCluster) => {
      return this.calculateWorkScore(stayPointCluster)
    })
    // here we return inferences for all clusters
    if (stayPointClusters.length <= 3) {
      return clusterScores
        .map((score, index) => {
          return this.createInferenceForCluster(
            InferenceType.work,
            stayPointClusters[index],
            score,
            weekDaysInTrajectory
          )
        })
        .sort((a, b) => b.confidence - a.confidence)
    }
    // if more than three clusters, we return only inferences of top three results
    const topThreeInferenceIndices =
      this.getIndicesOfThreeMaxValues(clusterScores)
    return topThreeInferenceIndices
      .map((topInferenceIndex) => {
        return this.createInferenceForCluster(
          InferenceType.work,
          stayPointClusters[topInferenceIndex],
          clusterScores[topInferenceIndex],
          weekDaysInTrajectory
        )
      })
      .sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * TODO
   */
  private inferPOIFromStayPointClusters(
    stayPointClusters: StayPointCluster[]
  ): Inference[] {
    if (stayPointClusters === undefined || stayPointClusters.length === 0) {
      return undefined
    }
    // filter out clusters which will not be POIs (for now, those with only one visit)
    const poiClusters = stayPointClusters.filter((stayPointCluster) => {
      return stayPointCluster.onSiteTimes.length > 1
    })
    if (poiClusters.length === 0) return undefined
    return poiClusters.map((poiCluster) => {
      // TODO here we assign a confidence value of 1/1 =1 (100%) to each POI - are there other options?
      return this.createInferenceForCluster(InferenceType.poi, poiCluster, 1, 1)
    })
  }

  // how many nights were spent at this cluster
  private calculateHomeScore(stayPointCluster: StayPointCluster): number {
    let score = 0
    let starttime: Date
    let endtime: Date
    const twentyeightHoursMs = 28 * 60 * 60 * 1000
    stayPointCluster.onSiteTimes.forEach((onSiteTime) => {
      starttime = new Date(onSiteTime[0].getTime())
      endtime = new Date(onSiteTime[1].getTime())
      // within every 28 hours, there surely is a period from 12pm to 4am
      while (endtime.getTime() - starttime.getTime() >= twentyeightHoursMs) {
        score += 1
        starttime.setDate(starttime.getDate() + 1)
      }
      // check if remaining period (<28h) covers 12pm to 4am (for this, start must be on day before end)
      if (starttime.getDate() !== endtime.getDate() && endtime.getHours() > 4) {
        score += 1
      }
    })
    return score
  }

  // how many workdays (listed as two separate halfs to account for lunch break) were spent at cluster
  private calculateWorkScore(stayPointCluster: StayPointCluster): number {
    let score = 0
    let starttime: Date
    let endtime: Date
    stayPointCluster.onSiteTimes.forEach((onSiteTime) => {
      starttime = new Date(onSiteTime[0].getTime())
      endtime = new Date(onSiteTime[1].getTime())
      while (starttime.getTime() < endtime.getTime()) {
        // due to the possibility of multi-day staypoints, we check each day separately
        if (
          starttime.getDate() === endtime.getDate() &&
          starttime.getMonth() === endtime.getMonth() &&
          starttime.getFullYear() === endtime.getFullYear()
        ) {
          // weekday, we count full workday (morning and afternoon) as 1 points
          if (starttime.getDay() !== 0 && starttime.getDay() !== 6) {
            if (starttime.getHours() <= 10 && endtime.getHours() >= 12)
              score += 0.5
            if (starttime.getHours() <= 14 && endtime.getHours() >= 16)
              score += 0.5
          }
          // else start and end on different days
        } else {
          if (starttime.getDay() !== 0 && starttime.getDay() !== 6) {
            // here the staypoint doesnt finish until the next day so we only need to check start
            if (starttime.getHours() <= 10) score += 0.5
            if (starttime.getHours() <= 14) score += 0.5
          }
        }
        // increment to next day shortly after midnight
        starttime.setDate(starttime.getDate() + 1)
        starttime.setHours(0, 0, 1)
      }
    })
    return score
  }

  // TODO: implement
  private calculatePOIScore(stayPointCluster: StayPointCluster): number {
    return 1
  }

  // assemble an inference object
  private createInferenceForCluster(
    inferenceType: InferenceType,
    stayPointCluster: StayPointCluster,
    clusterScore: number,
    numberOfDays: number
  ): Inference {
    let description: string
    switch (inferenceType) {
      case InferenceType.home:
        description =
          'Location where ' +
          clusterScore.toString() +
          ' nights (from 12pm to 4am) were spent'
        break
      case InferenceType.work:
        description =
          'Location where ' +
          clusterScore.toString() +
          ' workdays (weekdays from 10am to 12am and 2pm to 4pm) were spent'
        break
      case InferenceType.poi:
        description = `Location that was visited ${clusterScore.toString()} times`
        break
    }
    const convexHull = concaveman(stayPointCluster.componentCoordinates)
    return new Inference(
      inferenceType,
      inferenceType,
      description,
      stayPointCluster.trajID,
      stayPointCluster.coordinates,
      convexHull.map((c) => [c[0], c[1]]),
      clusterScore / numberOfDays
    )
  }

  // return indices of three max values for an array with at least four values, from https://stackoverflow.com/a/11792417
  private getIndicesOfThreeMaxValues(array: number[]): number[] {
    const max = [
      { value: array[0], index: 0 },
      { value: array[1], index: 1 },
      { value: array[2], index: 2 },
    ]
    max.sort((a, b) => a.value - b.value)
    for (let i = 3; i < array.length; i++) {
      if (array[i] > max[0].value) {
        max[0] = { value: array[i], index: i }
        max.sort((a, b) => a.value - b.value)
      }
    }
    return [max[2].index, max[1].index, max[0].index]
  }
}
