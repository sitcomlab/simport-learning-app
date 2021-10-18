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
    [51.97248011363634, 7.577652159090904],
    [51.96948411290324, 7.595815887096774],
    [51.972528644067815, 7.577654519774008],
  ],
  starttimes: [
    new Date('2021-02-23T18:00:00.000Z'),
    new Date('2021-02-24T08:57:36.000Z'),
    new Date('2021-02-24T17:12:13.311Z'),
  ],
  endtimes: [
    new Date('2021-02-24T08:48:54.000Z'),
    new Date('2021-02-24T17:03:36.644Z'),
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
