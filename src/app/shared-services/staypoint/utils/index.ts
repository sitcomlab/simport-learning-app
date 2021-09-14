import { Inference } from 'src/app/model/inference'
import { StayPointCluster, StayPoints } from 'src/app/model/staypoints'
import { InferenceType } from 'src/app/shared-services/inferences/engine/types'
import concaveman from 'concaveman'

/**
 * Get the location of the three clusters of staypoints where the most nights (12pm to 4am) were spent.
 * @param stayPointClusters The clusters of staypoints from which home location is to be extracted
 * @param daysInTrajectory The number of days for which the trajectory has been recorded,
 * used to calculate the "confidence" value (number of nights spent at staypoint/number of days in trajectory)
 * @return The top three home inferences
 */
export function inferHomeFromStayPointClusters(
  stayPointClusters: StayPointCluster[],
  daysInTrajectory: number
): Inference[] {
  if (stayPointClusters === undefined || stayPointClusters.length === 0) {
    return undefined
  }
  const clusterScores = stayPointClusters.map((stayPointCluster) => {
    return calculateHomeScore(stayPointCluster)
  })
  // here we return inferences for all clusters
  if (stayPointClusters.length <= 3) {
    return clusterScores
      .map((score, index) => {
        return createInferenceForCluster(
          InferenceType.home,
          stayPointClusters[index],
          score,
          daysInTrajectory
        )
      })
      .sort((a, b) => b.confidence - a.confidence)
  }
  // if more than three clusters, we return only inferences of top three results
  const topThreeInferenceIndices = getIndicesOfThreeMaxValues(clusterScores)
  return topThreeInferenceIndices
    .map((topInferenceIndex) => {
      return createInferenceForCluster(
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
export function inferWorkFromStayPointClusters(
  stayPointClusters: StayPointCluster[],
  weekDaysInTrajectory: number
): Inference[] {
  if (stayPointClusters === undefined || stayPointClusters.length === 0)
    return undefined
  const clusterScores = stayPointClusters.map((stayPointCluster) => {
    return calculateWorkScore(stayPointCluster)
  })
  // here we return inferences for all clusters
  if (stayPointClusters.length <= 3) {
    return clusterScores
      .map((score, index) => {
        return createInferenceForCluster(
          InferenceType.work,
          stayPointClusters[index],
          score,
          weekDaysInTrajectory
        )
      })
      .sort((a, b) => b.confidence - a.confidence)
  }
  // if more than three clusters, we return only inferences of top three results
  const topThreeInferenceIndices = getIndicesOfThreeMaxValues(clusterScores)
  return topThreeInferenceIndices
    .map((topInferenceIndex) => {
      return createInferenceForCluster(
        InferenceType.work,
        stayPointClusters[topInferenceIndex],
        clusterScores[topInferenceIndex],
        weekDaysInTrajectory
      )
    })
    .sort((a, b) => b.confidence - a.confidence)
}

// how many nights were spent at this cluster
function calculateHomeScore(stayPointCluster: StayPointCluster): number {
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
function calculateWorkScore(stayPointCluster: StayPointCluster): number {
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

// assemble an inference object
function createInferenceForCluster(
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
function getIndicesOfThreeMaxValues(array: number[]): number[] {
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
