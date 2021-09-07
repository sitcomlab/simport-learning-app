import { Inference } from 'src/app/model/inference'
import { StayPointCluster, StayPoints } from 'src/app/model/staypoints'
import { InferenceType } from 'src/app/shared-services/inferences/engine/types'

/**
 * Get the location of the cluster of staypoints where the most nights (12pm to 4am) were spent.
 * @param stayPointClusters The clusters of staypoints from which home location is to be extracted
 * @return A home Inference containing the center of the most likely home staypoint cluster
 */
export function inferHomeFromStayPointClusters(
  stayPointClusters: StayPointCluster[]
): Inference {
  if (stayPointClusters === undefined || stayPointClusters.length === 0) {
    return undefined
  }
  const clusterScores = stayPointClusters.map((stayPointCluster) => {
    return calculateHomeScore(stayPointCluster)
  })
  const topIndex = clusterScores.indexOf(Math.max(...clusterScores))
  return new Inference(
    InferenceType.home,
    InferenceType.home,
    'Staypoint cluster where most (' +
      clusterScores[topIndex].toString() +
      ') nights (from 12pm to 4am) were spent',
    stayPointClusters[topIndex].trajID,
    stayPointClusters[topIndex].coordinates,
    [stayPointClusters[topIndex].coordinates],
    80
  )
}

/**
 * Get the location of the cluster of staypoints where the most workdays were spent.
 * Each interval from 10am to 12am and from 2pm to 4pm on Mon-Fri contained within staypoint is counted.
 * @param stayPointClusters The staypoint clusters from which work location is to be extracted
 * @return A work Inference containing the center (mean) of the most likely work staypoint cluster
 */
export function inferWorkFromStayPointClusters(
  stayPointClusters: StayPointCluster[]
): Inference {
  if (stayPointClusters === undefined || stayPointClusters.length === 0)
    return undefined
  const clusterScores = stayPointClusters.map((stayPointCluster) => {
    return calculateWorkScore(stayPointCluster)
  })
  const topIndex = clusterScores.indexOf(Math.max(...clusterScores))
  return new Inference(
    InferenceType.work,
    InferenceType.work,
    'Staypoint cluster where most (' +
      clusterScores[topIndex].toString() +
      ') workdays (weekdays from 10am to 12am and 2pm to 4pm) were spent',
    stayPointClusters[topIndex].trajID,
    stayPointClusters[topIndex].coordinates,
    [stayPointClusters[topIndex].coordinates],
    80
  )
}

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
