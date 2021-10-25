import { HomeInference, POIInference, WorkInference } from '../definitions'
import * as fixtures from './staypoint-engine.spec.fixtures'
import { InferenceResultStatus, InferenceType } from '../types'
import { StaypointEngine } from './staypoint-engine'
import { StaypointService } from 'src/app/shared-services/staypoint/staypoint.service'
import { TestBed } from '@angular/core/testing'

describe('StaypointEngine', () => {
  let engine: StaypointEngine
  let staypointServiceSpy: jasmine.SpyObj<StaypointService>

  beforeEach(() => {
    const spySPService = jasmine.createSpyObj('StaypointService', [
      'updateStayPoints',
      'getStayPoints',
      'computeStayPointClusters',
    ])
    TestBed.configureTestingModule({
      providers: [{ provide: StaypointService, useValue: spySPService }],
    })
    staypointServiceSpy = TestBed.inject(
      StaypointService
    ) as jasmine.SpyObj<StaypointService>
    engine = new StaypointEngine(staypointServiceSpy)
  })

  it('should be created', () => {
    expect(engine).toBeTruthy()
  })

  it('#infer should not infer anything for undefined input', (done: DoneFn) => {
    staypointServiceSpy.getStayPoints.and.returnValue(
      Promise.resolve(fixtures.dummyStayPoints)
    )
    staypointServiceSpy.computeStayPointClusters.and.returnValue(
      Promise.resolve(undefined)
    )
    engine
      .infer(fixtures.oneWeekTrajectory, [WorkInference, HomeInference])
      .then((value) => {
        expect(value.status).toEqual(InferenceResultStatus.noInferencesFound)
        expect(value.inferences.length).toEqual(0)
        expect(staypointServiceSpy.updateStayPoints).toHaveBeenCalledOnceWith(
          fixtures.oneWeekTrajectory.type,
          fixtures.oneWeekTrajectory.id
        )
        expect(staypointServiceSpy.getStayPoints).toHaveBeenCalledOnceWith(
          fixtures.oneWeekTrajectory.id
        )
        expect(
          staypointServiceSpy.computeStayPointClusters
        ).toHaveBeenCalledOnceWith(fixtures.dummyStayPoints)
        done()
      })
  })

  it('#infer should not infer anything for an empty array of staypoint clusters', (done: DoneFn) => {
    staypointServiceSpy.getStayPoints.and.returnValue(
      Promise.resolve(fixtures.dummyStayPoints)
    )
    staypointServiceSpy.computeStayPointClusters.and.returnValue(
      Promise.resolve(fixtures.emptyClusters)
    )
    engine
      .infer(fixtures.oneWeekTrajectory, [WorkInference, HomeInference])
      .then((value) => {
        expect(value.status).toEqual(InferenceResultStatus.noInferencesFound)
        expect(value.inferences.length).toEqual(0)
        expect(staypointServiceSpy.updateStayPoints).toHaveBeenCalledOnceWith(
          fixtures.oneWeekTrajectory.type,
          fixtures.oneWeekTrajectory.id
        )
        expect(staypointServiceSpy.getStayPoints).toHaveBeenCalledOnceWith(
          fixtures.oneWeekTrajectory.id
        )
        expect(
          staypointServiceSpy.computeStayPointClusters
        ).toHaveBeenCalledOnceWith(fixtures.dummyStayPoints)
        done()
      })
  })

  it('#infer should correctly infer work from one week of very regular staypoint clusters', (done: DoneFn) => {
    staypointServiceSpy.getStayPoints.and.returnValue(
      Promise.resolve(fixtures.dummyStayPoints)
    )
    staypointServiceSpy.computeStayPointClusters.and.returnValue(
      Promise.resolve(fixtures.oneWeekRegularHomeWorkClusters)
    )
    engine.infer(fixtures.oneWeekTrajectory, [WorkInference]).then((value) => {
      expect(value.status).toEqual(InferenceResultStatus.successful)
      expect(value.inferences.length).toEqual(2)
      expect(value.inferences[0].type).toEqual(InferenceType.work)
      expect(value.inferences[0].confidence).toBeGreaterThan(0.75)
      expect(value.inferences[1].confidence).toBeLessThan(0.2)
      expect(value.inferences[0].latLng[0]).toBeCloseTo(
        fixtures.oneWeekRegularWorkCluster.coordinates[0]
      )
      expect(value.inferences[0].latLng[1]).toBeCloseTo(
        fixtures.oneWeekRegularWorkCluster.coordinates[1]
      )
      expect(staypointServiceSpy.updateStayPoints).toHaveBeenCalledOnceWith(
        fixtures.oneWeekTrajectory.type,
        fixtures.oneWeekTrajectory.id
      )
      expect(staypointServiceSpy.getStayPoints).toHaveBeenCalledOnceWith(
        fixtures.oneWeekTrajectory.id
      )
      expect(
        staypointServiceSpy.computeStayPointClusters
      ).toHaveBeenCalledOnceWith(fixtures.dummyStayPoints)
      done()
    })
  })

  it('#infer should correctly infer home from one week of very regular staypoint clusters', (done: DoneFn) => {
    staypointServiceSpy.getStayPoints.and.returnValue(
      Promise.resolve(fixtures.dummyStayPoints)
    )
    staypointServiceSpy.computeStayPointClusters.and.returnValue(
      Promise.resolve(fixtures.oneWeekRegularHomeWorkClusters)
    )
    engine.infer(fixtures.oneWeekTrajectory, [HomeInference]).then((value) => {
      expect(value.status).toEqual(InferenceResultStatus.successful)
      expect(value.inferences.length).toEqual(2)
      expect(value.inferences[0].type).toEqual(InferenceType.home)
      expect(value.inferences[0].confidence).toBeGreaterThan(0.75)
      expect(value.inferences[1].confidence).toBeLessThan(0.2)
      expect(value.inferences[0].latLng[0]).toBeCloseTo(
        fixtures.oneWeekRegularHomeCluster.coordinates[0]
      )
      expect(value.inferences[0].latLng[1]).toBeCloseTo(
        fixtures.oneWeekRegularHomeCluster.coordinates[1]
      )
      expect(staypointServiceSpy.updateStayPoints).toHaveBeenCalledOnceWith(
        fixtures.oneWeekTrajectory.type,
        fixtures.oneWeekTrajectory.id
      )
      expect(staypointServiceSpy.getStayPoints).toHaveBeenCalledOnceWith(
        fixtures.oneWeekTrajectory.id
      )
      expect(
        staypointServiceSpy.computeStayPointClusters
      ).toHaveBeenCalledOnceWith(fixtures.dummyStayPoints)
      done()
    })
  })

  it('#infer should correctly infer the most likely home from a number of candidate staypoint clusters', (done: DoneFn) => {
    staypointServiceSpy.getStayPoints.and.returnValue(
      Promise.resolve(fixtures.dummyStayPoints)
    )
    staypointServiceSpy.computeStayPointClusters.and.returnValue(
      Promise.resolve(fixtures.twoWeekmixedHomeCluster)
    )
    engine.infer(fixtures.twoWeekTrajectory, [HomeInference]).then((value) => {
      expect(value.status).toEqual(InferenceResultStatus.successful)
      expect(value.inferences.length).toEqual(3)
      expect(value.inferences[0].type).toEqual(InferenceType.home)
      expect(value.inferences[0].confidence).toBeGreaterThan(0.25)
      expect(value.inferences[0].confidence).toBeGreaterThan(
        value.inferences[1].confidence
      )
      expect(value.inferences[0].latLng[0]).toBeCloseTo(
        fixtures.fourDayHomeCluster.coordinates[0]
      )
      expect(value.inferences[0].latLng[1]).toBeCloseTo(
        fixtures.fourDayHomeCluster.coordinates[1]
      )
      expect(staypointServiceSpy.updateStayPoints).toHaveBeenCalledOnceWith(
        fixtures.twoWeekTrajectory.type,
        fixtures.twoWeekTrajectory.id
      )
      expect(staypointServiceSpy.getStayPoints).toHaveBeenCalledOnceWith(
        fixtures.twoWeekTrajectory.id
      )
      expect(
        staypointServiceSpy.computeStayPointClusters
      ).toHaveBeenCalledOnceWith(fixtures.dummyStayPoints)
      done()
    })
  })

  it('#infer should correctly infer a poi', (done: DoneFn) => {
    staypointServiceSpy.getStayPoints.and.returnValue(
      Promise.resolve(fixtures.dummyStayPoints)
    )
    staypointServiceSpy.computeStayPointClusters.and.returnValue(
      Promise.resolve(fixtures.oneWeekRegularHomeWorkPOIClusters)
    )
    engine
      .infer(fixtures.homeSportHomeTrajectory, [POIInference])
      .then((value) => {
        console.log(value)
        expect(value.status).toEqual(InferenceResultStatus.successful)
        expect(value.inferences.length).toEqual(1)
        expect(value.inferences[0].type).toEqual(InferenceType.poi)
        expect(value.inferences[0].confidence).toBe(1)
        expect(value.inferences[0].latLng[0]).toBeCloseTo(
          fixtures.oneWeekRegularPOICluster.coordinates[0]
        )
        expect(value.inferences[0].latLng[1]).toBeCloseTo(
          fixtures.oneWeekRegularPOICluster.coordinates[1]
        )
        expect(staypointServiceSpy.updateStayPoints).toHaveBeenCalledOnceWith(
          fixtures.homeSportHomeTrajectory.type,
          fixtures.homeSportHomeTrajectory.id
        )
        expect(staypointServiceSpy.getStayPoints).toHaveBeenCalledOnceWith(
          fixtures.homeSportHomeTrajectory.id
        )
        expect(
          staypointServiceSpy.computeStayPointClusters
        ).toHaveBeenCalledOnceWith(fixtures.dummyStayPoints)
        done()
      })
  })
})
