import { TestBed } from '@angular/core/testing'
import { StaypointService } from './staypoint.service'
import { SqliteService } from '../../shared-services/db/sqlite.service'
import {
  Trajectory,
  TrajectoryData,
  TrajectoryType,
  TrajectoryMeta,
} from 'src/app/model/trajectory'
import { StayPoints } from 'src/app/model/staypoints'
import { TrajectoryService } from '../trajectory/trajectory.service'
import { of } from 'rxjs'
import * as fixtures from './staypoint.service.spec.fixtures'

// run with "ng test --include src\app\shared-services\staypoint\staypoint.service.spec.ts"

describe('StaypointService', () => {
  let service: StaypointService
  let sqliteServiceSpy: jasmine.SpyObj<SqliteService>
  let trajServiceSpy: jasmine.SpyObj<TrajectoryService>

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
      Promise.resolve(fixtures.homeWorkStayPoints)
    )
    service.getStayPoints('randomId').then((value) => {
      expect(value).toEqual(
        fixtures.homeWorkStayPoints,
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
    trajServiceSpy.getOne.and.returnValue(of(fixtures.homeWorkTraj))
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
      expect(
        areStayPointsSimilar(spReturned, fixtures.homeWorkStayPoints)
      ).toBe(true)
      done()
    })
  })

  it('#updateStayPoints for trajectory with only one point should return empty staypoints', (done: DoneFn) => {
    trajServiceSpy.getOne.and.returnValue(of(fixtures.cutTraj))
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
      expect(areStayPointsSimilar(spReturned, fixtures.emptyStayPoints)).toBe(
        true
      )
      done()
    })
  })

  it('#updateStayPoints should calculate correct staypoints for traj w previously calculated incomplete staypoints', (done: DoneFn) => {
    trajServiceSpy.getOne.and.returnValue(of(fixtures.homeWorkTraj))
    sqliteServiceSpy.getStaypoints.and.returnValue(
      Promise.resolve(fixtures.cutHomeWorkStayPoints)
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
      expect(
        areStayPointsSimilar(spReturned, fixtures.homeWorkStayPoints)
      ).toBe(true)
      done()
    })
  })

  it('#updateStayPoints should calculate correct staypoints for traj w previously calculated complete staypoints', (done: DoneFn) => {
    trajServiceSpy.getOne.and.returnValue(of(fixtures.homeWorkTraj))
    sqliteServiceSpy.getStaypoints.and.returnValue(
      Promise.resolve(fixtures.homeWorkStayPoints)
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
      expect(
        areStayPointsSimilar(spReturned, fixtures.homeWorkStayPoints)
      ).toBe(true)
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
