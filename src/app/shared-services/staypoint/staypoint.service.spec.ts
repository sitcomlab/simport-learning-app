import { TestBed } from '@angular/core/testing'
import { StaypointService } from './staypoint.service'
import { SqliteService } from '../../shared-services/db/sqlite.service'
import trajectoryFileHomeWork from '../inferences/test-data/test-home-work.json'
import {
  Trajectory,
  TrajectoryData,
  TrajectoryType,
  TrajectoryMeta,
} from 'src/app/model/trajectory'
import { StayPoints } from 'src/app/model/staypoints'
import { TrajectoryService } from '../trajectory/trajectory.service'
import { empty, Observable, of } from 'rxjs'

// run with "ng test --include src\app\shared-services\staypoint\staypoint.service.spec.ts"

describe('StaypointService', () => {
  let service: StaypointService
  let sqliteServiceSpy: jasmine.SpyObj<SqliteService>
  let trajServiceSpy: jasmine.SpyObj<TrajectoryService>

  const homeWorkTrajData: TrajectoryData = Trajectory.fromJSON(
    trajectoryFileHomeWork
  )
  const homeWorkTrajMeta: TrajectoryMeta = {
    id: 'randomId',
    type: TrajectoryType.EXAMPLE,
    placename: 'none',
  }
  const homeWorkTraj = new Trajectory(homeWorkTrajMeta, homeWorkTrajData)
  // please note: these staypoints were created for parameters DIST_THRESH_METERS = 100 and TIME_THRESH_MINUTES = 15
  // if these change in the staypoint module, this needs to be adjusted as well
  const homeWorkStayPoints: StayPoints = {
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
  const cutHomeWorkStayPoints: StayPoints = {
    coordinates: homeWorkStayPoints.coordinates.slice(0, 1),
    starttimes: homeWorkStayPoints.starttimes.slice(0, 1),
    endtimes: homeWorkStayPoints.endtimes.slice(0, 1),
    trajID: 'randomId',
  }
  const cutTrajData: TrajectoryData = {
    coordinates: [homeWorkTrajData.coordinates[0]],
    timestamps: [homeWorkTrajData.timestamps[0]],
  }
  const cutTraj: Trajectory = new Trajectory(homeWorkTrajMeta, cutTrajData)
  const emptyStayPoints: StayPoints = {
    trajID: 'randomId',
    coordinates: [],
    starttimes: [],
    endtimes: [],
  }

  beforeEach(() => {
    const spyDB = jasmine.createSpyObj('SqliteService', [
      'getStaypoints',
      'upsertStaypoints',
      'deleteStaypoints',
    ])
    const spyTS = jasmine.createSpyObj('TrajectoryService', ['getOne'])

    TestBed.configureTestingModule({
      providers: [
        StaypointService,
        { provide: SqliteService, useValue: spyDB },
        { provide: TrajectoryService, useValue: spyTS },
      ],
    })
    service = TestBed.inject(StaypointService)
    sqliteServiceSpy = TestBed.inject(
      SqliteService
    ) as jasmine.SpyObj<SqliteService>
    trajServiceSpy = TestBed.inject(
      TrajectoryService
    ) as jasmine.SpyObj<TrajectoryService>
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('#getStayPoints should pass call to mock db with correct ID and return what mock db returns', (done: DoneFn) => {
    sqliteServiceSpy.getStaypoints.and.returnValue(
      Promise.resolve(homeWorkStayPoints)
    )
    service.getStayPoints('randomId').then((value) => {
      expect(value).toEqual(
        homeWorkStayPoints,
        'return from mock service is passed through'
      )
      expect(sqliteServiceSpy.getStaypoints).toHaveBeenCalledOnceWith(
        'randomId'
      )
      done()
    })
  })

  it('#deleteStayPoints should pass call to database with correct ID', (done: DoneFn) => {
    sqliteServiceSpy.deleteStaypoints.and.returnValue(
      Promise.resolve(undefined)
    )
    service.deleteStayPoints('randomId').then(() => {
      expect(sqliteServiceSpy.deleteStaypoints).toHaveBeenCalledOnceWith(
        'randomId'
      )
      done()
    })
  })

  it('#updateStayPoints should calculate the correct staypoints for trajectory w/o previously calculated staypoints', (done: DoneFn) => {
    trajServiceSpy.getOne.and.returnValue(of(homeWorkTraj))
    sqliteServiceSpy.getStaypoints.and.returnValue(Promise.resolve(undefined))
    sqliteServiceSpy.upsertStaypoints.and.returnValue(
      Promise.resolve(undefined)
    )
    service.updateStayPoints(TrajectoryType.USERTRACK, 'randomId').then(() => {
      expect(trajServiceSpy.getOne).toHaveBeenCalledOnceWith(
        TrajectoryType.USERTRACK,
        'randomId'
      )
      expect(sqliteServiceSpy.getStaypoints).toHaveBeenCalledOnceWith(
        'randomId'
      )
      expect(sqliteServiceSpy.upsertStaypoints).toHaveBeenCalledTimes(1)
      expect(sqliteServiceSpy.upsertStaypoints.calls.argsFor(0)[0]).toEqual(
        'randomId'
      )
      const spReturned = sqliteServiceSpy.upsertStaypoints.calls.argsFor(0)[1]
      expect(areStayPointsSimilar(spReturned, homeWorkStayPoints)).toBe(true)
      done()
    })
  })

  it('#updateStayPoints for trajectory with only one point should return empty staypoints', (done: DoneFn) => {
    trajServiceSpy.getOne.and.returnValue(of(cutTraj))
    sqliteServiceSpy.getStaypoints.and.returnValue(Promise.resolve(undefined))
    sqliteServiceSpy.upsertStaypoints.and.returnValue(
      Promise.resolve(undefined)
    )
    service.updateStayPoints(TrajectoryType.USERTRACK, 'randomId').then(() => {
      expect(trajServiceSpy.getOne).toHaveBeenCalledOnceWith(
        TrajectoryType.USERTRACK,
        'randomId'
      )
      expect(sqliteServiceSpy.getStaypoints).toHaveBeenCalledOnceWith(
        'randomId'
      )
      expect(sqliteServiceSpy.upsertStaypoints).toHaveBeenCalledTimes(1)
      expect(sqliteServiceSpy.upsertStaypoints.calls.argsFor(0)[0]).toEqual(
        'randomId'
      )
      const spReturned = sqliteServiceSpy.upsertStaypoints.calls.argsFor(0)[1]
      expect(areStayPointsSimilar(spReturned, emptyStayPoints)).toBe(true)
      done()
    })
  })

  it('#updateStayPoints should calculate correct staypoints for traj w previously calculated incomplete staypoints', (done: DoneFn) => {
    trajServiceSpy.getOne.and.returnValue(of(homeWorkTraj))
    sqliteServiceSpy.getStaypoints.and.returnValue(
      Promise.resolve(cutHomeWorkStayPoints)
    )
    sqliteServiceSpy.upsertStaypoints.and.returnValue(
      Promise.resolve(undefined)
    )
    service.updateStayPoints(TrajectoryType.USERTRACK, 'randomId').then(() => {
      expect(trajServiceSpy.getOne).toHaveBeenCalledOnceWith(
        TrajectoryType.USERTRACK,
        'randomId'
      )
      expect(sqliteServiceSpy.getStaypoints).toHaveBeenCalledOnceWith(
        'randomId'
      )
      expect(sqliteServiceSpy.upsertStaypoints).toHaveBeenCalledTimes(1)
      expect(sqliteServiceSpy.upsertStaypoints.calls.argsFor(0)[0]).toEqual(
        'randomId'
      )
      const spReturned = sqliteServiceSpy.upsertStaypoints.calls.argsFor(0)[1]
      expect(areStayPointsSimilar(spReturned, homeWorkStayPoints)).toBe(true)
      done()
    })
  })

  it('#updateStayPoints should calculate correct staypoints for traj w previously calculated complete staypoints', (done: DoneFn) => {
    trajServiceSpy.getOne.and.returnValue(of(homeWorkTraj))
    sqliteServiceSpy.getStaypoints.and.returnValue(
      Promise.resolve(homeWorkStayPoints)
    )
    sqliteServiceSpy.upsertStaypoints.and.returnValue(
      Promise.resolve(undefined)
    )
    service.updateStayPoints(TrajectoryType.USERTRACK, 'randomId').then(() => {
      expect(trajServiceSpy.getOne).toHaveBeenCalledOnceWith(
        TrajectoryType.USERTRACK,
        'randomId'
      )
      expect(sqliteServiceSpy.getStaypoints).toHaveBeenCalledOnceWith(
        'randomId'
      )
      expect(sqliteServiceSpy.upsertStaypoints).toHaveBeenCalledTimes(1)
      expect(sqliteServiceSpy.upsertStaypoints.calls.argsFor(0)[0]).toEqual(
        'randomId'
      )
      const spReturned = sqliteServiceSpy.upsertStaypoints.calls.argsFor(0)[1]
      expect(areStayPointsSimilar(spReturned, homeWorkStayPoints)).toBe(true)
      done()
    })
  })
})

function areStayPointsSimilar(sp1: StayPoints, sp2: StayPoints): boolean {
  if (
    sp1.trajID !== sp2.trajID ||
    sp1.coordinates.length !== sp2.coordinates.length ||
    sp1.starttimes.length !== sp2.endtimes.length ||
    sp1.starttimes.length !== sp2.endtimes.length
  ) {
    return false
  }
  const precisionCoordinates = 0.0001
  const precisionMs = 100
  for (let i = 0; i < sp2.coordinates.length; i++) {
    if (
      Math.abs(sp1.coordinates[i][0] - sp2.coordinates[i][0]) >
        precisionCoordinates ||
      Math.abs(sp1.coordinates[i][1] - sp2.coordinates[i][1]) >
        precisionCoordinates ||
      Math.abs(sp1.starttimes[i].getTime() - sp2.starttimes[i].getTime()) >
        precisionMs ||
      Math.abs(sp1.endtimes[i].getTime() - sp2.endtimes[i].getTime()) >
        precisionMs
    ) {
      return false
    }
  }

  return true
}
