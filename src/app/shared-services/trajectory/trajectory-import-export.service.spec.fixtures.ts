import {
  Trajectory,
  TrajectoryData,
  TrajectoryMeta,
  TrajectoryType,
} from '../../model/trajectory'

export const testTrajectoryName = 'test-name'

export const testTrajectoryMeta: TrajectoryMeta = {
  id: 'test-id',
  placename: testTrajectoryName,
  durationDays: 4,
  type: TrajectoryType.USERTRACK,
}

export const testTrajectoryData: TrajectoryData = {
  coordinates: [
    [41.85438, -87.64559],
    [41.86282, -87.64456],
    [41.87458, -87.6449],
    [41.87586, -87.66173],
    [41.87637, -87.68438],
  ],
  timestamps: [
    new Date(1577880000000),
    new Date(1577966400000),
    new Date(1578052800000),
    new Date(1578139200000),
    new Date(1578225600000),
  ],
}

export const testTrajectory: Trajectory = new Trajectory(
  testTrajectoryMeta,
  testTrajectoryData
)

export const testTrajectoryPolyline = '{tm~F|g}uOws@mEohAbA_GdhBeBplC'
export const testTrajectoryString = `
    {
        "coordinates": "${testTrajectoryPolyline}",
        "timestamps": [86400, 86400, 86400, 86400],
        "accuracy":[],
        "speed":[],
        "time0": "2020-01-01T12:00:00.000Z",
        "timeN": "2020-01-05T12:00:00.000Z"
    }
  `

export const testTrajectoryBase64String =
  'eyJjb29yZGluYXRlcyI6Int0bX5GfGd9dU93c0BtRW9oQWJBX0dkaEJlQnBsQyIsInRpbWVzdGFtcHMiOls4NjQwMCw4NjQwMCw4NjQwMCw4NjQwMF0sImFjY3VyYWN5IjpbXSwic3BlZWQiOltdLCJ0aW1lMCI6IjIwMjAtMDEtMDFUMTI6MDA6MDAuMDAwWiIsInRpbWVOIjoiMjAyMC0wMS0wNVQxMjowMDowMC4wMDBaIn0='
