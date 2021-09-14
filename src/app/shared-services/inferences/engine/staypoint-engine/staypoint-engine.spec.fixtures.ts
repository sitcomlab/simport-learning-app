import {
  Trajectory,
  TrajectoryMeta,
  TrajectoryType,
} from 'src/app/model/trajectory'
import trajectoryFileHomeWork from '../../test-data/test-home-work.json'
import { StayPointCluster, StayPoints } from 'src/app/model/staypoints'

const trajectoryMeta: TrajectoryMeta = {
  id: 'randomId',
  placename: 'test-place',
  type: TrajectoryType.USERTRACK,
  durationDays: null,
}
const oneWeekTrajectoryData = Trajectory.fromJSON(trajectoryFileHomeWork)
oneWeekTrajectoryData.timestamps[0] = new Date(2021, 2, 12, 9)
oneWeekTrajectoryData.timestamps[oneWeekTrajectoryData.timestamps.length - 1] =
  new Date(2021, 2, 19, 9)
export const oneWeekTrajectory = new Trajectory(
  trajectoryMeta,
  oneWeekTrajectoryData
)

const twoWeekTrajectoryData = Trajectory.fromJSON(trajectoryFileHomeWork)
twoWeekTrajectoryData.timestamps[0] = new Date(2021, 2, 12, 9)
twoWeekTrajectoryData.timestamps[twoWeekTrajectoryData.timestamps.length - 1] =
  new Date(2021, 2, 26, 9)
export const twoWeekTrajectory = new Trajectory(
  trajectoryMeta,
  twoWeekTrajectoryData
)

export const dummyStayPoints: StayPoints = undefined

export const emptyClusters: StayPointCluster[] = []

export const oneWeekRegularHomeCluster: StayPointCluster = {
  trajID: 'randomId',
  coordinates: [51.97248011363634, 7.577652159090904],
  onSiteTimes: [
    [new Date(2021, 2, 12, 21), new Date(2021, 2, 15, 5, 10)],
    [new Date(2021, 2, 15, 23, 55), new Date(2021, 2, 16, 6)],
    [new Date(2021, 2, 16, 22), new Date(2021, 2, 17, 5, 45)],
    [new Date(2021, 2, 17, 23, 1), new Date(2021, 2, 18, 8)],
    [new Date(2021, 2, 18, 20), new Date(2021, 2, 19, 7, 30)],
  ],
  componentCoordinates: [[51.97248011363634, 7.577652159090904]],
}
export const oneWeekRegularWorkCluster: StayPointCluster = {
  trajID: 'randomId',
  coordinates: [51.57248011363634, 7.877652159090904],
  onSiteTimes: [
    [new Date(2021, 2, 12, 9), new Date(2021, 2, 12, 17)],
    [new Date(2021, 2, 15, 7), new Date(2021, 2, 15, 16, 45)],
    [new Date(2021, 2, 16, 6), new Date(2021, 2, 16, 19)],
    [new Date(2021, 2, 17, 5), new Date(2021, 2, 17, 18)],
    [new Date(2021, 2, 18, 8), new Date(2021, 2, 18, 17)],
  ],
  componentCoordinates: [[51.57248011363634, 7.877652159090904]],
}
export const oneWeekRegularHomeWorkClusters = [
  oneWeekRegularHomeCluster,
  oneWeekRegularWorkCluster,
]

export const twoDayHomeClusterOne: StayPointCluster = {
  trajID: 'randomId',
  coordinates: [51.97248011363634, 7.577652159090904],
  onSiteTimes: [[new Date(2021, 2, 12, 21), new Date(2021, 2, 14, 5, 10)]],
  componentCoordinates: [[51.97248011363634, 7.577652159090904]],
}
export const twoDayHomeClusterTwo: StayPointCluster = {
  trajID: 'randomId',
  coordinates: [51.973, 7.5774],
  onSiteTimes: [
    [new Date(2021, 2, 14, 21), new Date(2021, 2, 15, 5, 10)],
    [new Date(2021, 2, 15, 21), new Date(2021, 2, 16, 5, 10)],
  ],
  componentCoordinates: [[51.973, 7.5774]],
}
export const threeDayHomeClusterOne: StayPointCluster = {
  trajID: 'randomId',
  coordinates: [51.54, 7.21],
  onSiteTimes: [
    [new Date(2021, 2, 16, 21), new Date(2021, 2, 17, 5, 6)],
    [new Date(2021, 2, 17, 19), new Date(2021, 2, 18, 7, 6)],
    [new Date(2021, 2, 18, 22), new Date(2021, 2, 19, 9, 7)],
  ],
  componentCoordinates: [[51.54, 7.21]],
}
export const fourDayHomeCluster: StayPointCluster = {
  trajID: 'randomId',
  coordinates: [51.88, 7.88],
  onSiteTimes: [
    [new Date(2021, 2, 19, 21), new Date(2021, 2, 20, 5, 6)],
    [new Date(2021, 2, 20, 19), new Date(2021, 2, 21, 10, 6)],
    [new Date(2021, 2, 21, 22), new Date(2021, 2, 22, 5, 7)],
    [new Date(2021, 2, 22, 23), new Date(2021, 2, 23, 12, 7)],
  ],
  componentCoordinates: [[51.88, 7.88]],
}
export const threeDayHomeClusterTwo: StayPointCluster = {
  trajID: 'randomId',
  coordinates: [51.11, 7.192],
  onSiteTimes: [
    [new Date(2021, 2, 23, 21), new Date(2021, 2, 24, 5, 6)],
    [new Date(2021, 2, 24, 19), new Date(2021, 2, 25, 7, 6)],
    [new Date(2021, 2, 25, 22), new Date(2021, 2, 26, 9, 7)],
  ],
  componentCoordinates: [[51.11, 7.192]],
}
export const twoWeekmixedHomeCluster = [
  twoDayHomeClusterOne,
  twoDayHomeClusterTwo,
  threeDayHomeClusterOne,
  fourDayHomeCluster,
  threeDayHomeClusterTwo,
]
