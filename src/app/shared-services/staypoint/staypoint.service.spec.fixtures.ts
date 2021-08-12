import trajectoryFileHomeWork from '../inferences/test-data/test-home-work.json'
import {
  Trajectory,
  TrajectoryData,
  TrajectoryType,
  TrajectoryMeta,
} from 'src/app/model/trajectory'
import { StayPoints } from 'src/app/model/staypoints'

export const homeWorkTrajData: TrajectoryData = Trajectory.fromJSON(
  trajectoryFileHomeWork
)
export const homeWorkTrajMeta: TrajectoryMeta = {
  id: 'randomId',
  type: TrajectoryType.EXAMPLE,
  placename: 'none',
}
export const homeWorkTraj = new Trajectory(homeWorkTrajMeta, homeWorkTrajData)
// please note: these staypoints were created for parameters DIST_THRESH_METERS = 100 and TIME_THRESH_MINUTES = 15
// if these change in the staypoint module, this needs to be adjusted as well
export const homeWorkStayPoints: StayPoints = {
  coordinates: [
    [51.97247949044584, 7.5777314649681475],
    [51.96946537190084, 7.595825289256202],
    [51.97247736196318, 7.57774036809816],
  ],
  starttimes: [
    new Date('2021-02-23T18:00:00.000Z'),
    new Date('2021-02-24T08:57:45.000Z'),
    new Date('2021-02-24T17:14:09.978Z'),
  ],
  endtimes: [
    new Date('2021-02-24T08:46:03.000Z'),
    new Date('2021-02-24T17:03:19.978Z'),
    new Date('2021-02-25T08:39:04.541Z'),
  ],
  trajID: 'randomId',
}
export const cutHomeWorkStayPoints: StayPoints = {
  coordinates: homeWorkStayPoints.coordinates.slice(0, 1),
  starttimes: homeWorkStayPoints.starttimes.slice(0, 1),
  endtimes: homeWorkStayPoints.endtimes.slice(0, 1),
  trajID: 'randomId',
}
export const cutTrajData: TrajectoryData = {
  coordinates: [homeWorkTrajData.coordinates[0]],
  timestamps: [homeWorkTrajData.timestamps[0]],
}
export const cutTraj: Trajectory = new Trajectory(homeWorkTrajMeta, cutTrajData)
export const emptyStayPoints: StayPoints = {
  trajID: 'randomId',
  coordinates: [],
  starttimes: [],
  endtimes: [],
}
