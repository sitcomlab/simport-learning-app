import { Inference } from 'src/app/model/inference'
import { PointState, Trajectory } from 'src/app/model/trajectory'
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
import { v4 as uuid } from 'uuid'
import { TimetableService } from 'src/app/shared-services/timetable/timetable.service'

export class StaypointEngine implements IInferenceEngine {
  scorings: IInferenceScoring[] = [
    new NightnessScoring(),
    new WorkHoursScoring(),
  ]

  constructor(
    private staypointService: StaypointService,
    private timetableService: TimetableService
  ) {}

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

  /**
   * @param trajectory a user trajectory
   * @returns the number of days during which the trajectory was recorded
   */
  private countDays(trajectory: Trajectory): number {
    if (!trajectory.state) {
      return this.countContinuousDays(
        trajectory.timestamps[0],
        trajectory.timestamps[trajectory.timestamps.length - 1]
      )
    }
    // find indices where trajectory has started
    const startIndices = []
    let idx = 0
    while (idx !== -1) {
      startIndices.push(idx)
      idx = trajectory.state.indexOf(PointState.START, idx + 1)
    }
    // process each section after start individually
    let sumDays = 0
    for (let i = 0; i++; i < startIndices.length - 1) {
      const date1 = trajectory.timestamps[startIndices[i]]
      const date2 = trajectory.timestamps[startIndices[i + 1] - 1]
      sumDays += this.countContinuousDays(date1, date2)
      // countContinuousDays counts every started day as one, so we need to
      // make sure we dont double count for start/end in same day
      if (i !== 0) {
        const prevDate = trajectory.timestamps[startIndices[i] - 1]
        if (this.isSameDate(date1, prevDate)) {
          sumDays -= 1
        }
      }
    }
    // count days after the last start of recording
    if (
      startIndices[startIndices.length - 1] !== trajectory.timestamps.length
    ) {
      const lastStartIndex = startIndices[startIndices.length - 1]
      const date1 = trajectory.timestamps[lastStartIndex]
      const date2 = trajectory.timestamps[trajectory.timestamps.length - 1]
      sumDays += this.countContinuousDays(date1, date2)
      if (lastStartIndex !== 0) {
        const prevDate = trajectory.timestamps[lastStartIndex - 1]
        if (this.isSameDate(date1, prevDate)) {
          sumDays -= 1
        }
      }
    }
    return sumDays
  }

  /**
   * count number of days between two dates, such that the last started day counts as a full one
   */
  private countContinuousDays(startDate: Date, endDate: Date): number {
    const diffMs = endDate.getTime() - startDate.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    // we round up as half a day can also get counted as a work/home day in scoring
    return Math.floor(diffDays) + 1
  }

  /**
   * @param trajectory a user trajectory
   * @returns the number of week days during which the trajectory was recorded
   */
  private countWeekDays(trajectory: Trajectory): number {
    if (!trajectory.state) {
      return this.countContinuousWeekDays(
        trajectory.timestamps[0],
        trajectory.timestamps[trajectory.timestamps.length - 1]
      )
    }
    // find indices where trajectory has started
    const startIndices = []
    let idx = 0
    while (idx !== -1) {
      startIndices.push(idx)
      idx = trajectory.state.indexOf(PointState.START, idx + 1)
    }
    // process each section after start individually
    let sumWeekDays = 0
    for (let i = 0; i++; i < startIndices.length - 1) {
      const date1 = trajectory.timestamps[startIndices[i]]
      const date2 = trajectory.timestamps[startIndices[i + 1] - 1]
      sumWeekDays += this.countContinuousWeekDays(date1, date2)
      // countContinuousDays counts every started weekday as one, so we need to
      // make sure we dont double count for start/end in same weekday
      if (i !== 0) {
        const prevDate = trajectory.timestamps[startIndices[i] - 1]
        if (this.isSameDate(date1, prevDate) && !(date1.getDay() in [0, 6])) {
          sumWeekDays -= 1
        }
      }
    }
    // count days after the last start of recording
    if (
      startIndices[startIndices.length - 1] !== trajectory.timestamps.length
    ) {
      const lastStartIndex = startIndices[startIndices.length - 1]
      const date1 = trajectory.timestamps[lastStartIndex]
      const date2 = trajectory.timestamps[trajectory.timestamps.length - 1]
      sumWeekDays += this.countContinuousWeekDays(date1, date2)
      if (lastStartIndex !== 0) {
        const prevDate = trajectory.timestamps[lastStartIndex - 1]
        if (this.isSameDate(date1, prevDate) && !(date1.getDay() in [0, 6])) {
          sumWeekDays -= 1
        }
      }
    }
    return sumWeekDays
  }

  /**
   * count number of weekdays between two dates, such that the last started day counts as a full one
   */
  private countContinuousWeekDays(startDate: Date, endDate: Date): number {
    let count = 0
    const currentDate = new Date(startDate)
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
      const inference = this.createInferenceForCluster(
        InferenceType.poi,
        poiCluster,
        poiCluster.onSiteTimes.length,
        poiCluster.onSiteTimes.length // pass number of visits for description
      )

      return inference
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
        if (this.isSameDate(starttime, endtime)) {
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
      uuid(),
      inferenceType,
      inferenceType,
      description,
      stayPointCluster.trajID,
      stayPointCluster.coordinates,
      convexHull.map((c) => [c[0], c[1]]),
      clusterScore / numberOfDays,
      undefined,
      stayPointCluster.onSiteTimes
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

  private isSameDate(firstDate: Date, secondDate: Date): boolean {
    return (
      firstDate.getDate() === secondDate.getDate() &&
      firstDate.getMonth() === secondDate.getMonth() &&
      firstDate.getFullYear() === secondDate.getFullYear()
    )
  }
}
