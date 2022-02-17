import { TestBed } from '@angular/core/testing'
import { TranslateService } from '@ngx-translate/core'
import { APP_TEST_IMPORTS } from 'src/app/app.declarations'
import { SqliteService } from 'src/app/shared-services/db/sqlite.service'
import { TrajectoryService } from 'src/app/shared-services/trajectory/trajectory.service'
import { BackgroundService } from '../background/background.service'
import { FeatureFlagService } from '../feature-flag/feature-flag.service'
import { NotificationService } from '../notification/notification.service'

import { TimetableService } from './timetable.service'
import * as fixtures from './timetable.service.spec.fixtures'

describe('TimetableService', () => {
  let service: TimetableService

  let dbServiceSpy: jasmine.SpyObj<SqliteService>
  let trajectoryServiceSpy: jasmine.SpyObj<TrajectoryService>
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>
  let backgroundServiceSpy: jasmine.SpyObj<BackgroundService>
  let featureFlagServiceSpy: jasmine.SpyObj<FeatureFlagService>
  let translateServiceSpy: jasmine.SpyObj<TranslateService>

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: APP_TEST_IMPORTS,
      providers: [
        {
          provide: SqliteService,
          useValue: jasmine.createSpyObj('SqliteService', [
            'upsertTimetable',
            'getMostFrequentVisitByDayAndHour',
            'getInferenceById',
          ]),
        },
        {
          provide: NotificationService,
          useValue: jasmine.createSpyObj('NotificationService', ['notify']),
        },
        {
          provide: TrajectoryService,
          useValue: jasmine.createSpyObj('TrajectoryService', [
            'getFullUserTrack',
          ]),
        },
        FeatureFlagService,
      ],
    })
    dbServiceSpy = TestBed.inject(
      SqliteService
    ) as jasmine.SpyObj<SqliteService>
    notificationServiceSpy = TestBed.inject(
      NotificationService
    ) as jasmine.SpyObj<NotificationService>
    trajectoryServiceSpy = TestBed.inject(
      TrajectoryService
    ) as jasmine.SpyObj<TrajectoryService>
    backgroundServiceSpy = TestBed.inject(
      BackgroundService
    ) as jasmine.SpyObj<BackgroundService>
    featureFlagServiceSpy = TestBed.inject(
      FeatureFlagService
    ) as jasmine.SpyObj<FeatureFlagService>
    translateServiceSpy = TestBed.inject(
      TranslateService
    ) as jasmine.SpyObj<TranslateService>

    service = new TimetableService(
      dbServiceSpy,
      notificationServiceSpy,
      trajectoryServiceSpy,
      featureFlagServiceSpy,
      backgroundServiceSpy,
      translateServiceSpy
    )
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('#createAndSaveTimetable should not save anything for empty inference list', (done: DoneFn) => {
    service.createAndSaveTimetable([], 'randomId').then(() => {
      expect(dbServiceSpy.upsertTimetable).toHaveBeenCalledOnceWith(
        [],
        'randomId'
      )
      done()
    })
  })

  it('#createAndSaveTimetable should correctly distribute a stay on the hours it covered', (done: DoneFn) => {
    service
      .createAndSaveTimetable([fixtures.oneMondayFiveToNine], 'randomId')
      .then(() => {
        expect(dbServiceSpy.upsertTimetable).toHaveBeenCalledWith(
          jasmine.arrayContaining(fixtures.timetableOneMondayFiveToNine),
          'randomId'
        ),
          done()
      })
  })

  it('#createAndSaveTimetable should correctly distribute a stay covering multiple days', (done: DoneFn) => {
    service
      .createAndSaveTimetable([fixtures.multiDayMonToWedFive], 'randomId')
      .then(() => {
        expect(dbServiceSpy.upsertTimetable).toHaveBeenCalledWith(
          jasmine.arrayContaining([
            {
              weekday: 1,
              hour: 5,
              inference: fixtures.multiDayMonToWedFive.id,
              count: 1,
            },
            {
              weekday: 3,
              hour: 5,
              inference: fixtures.multiDayMonToWedFive.id,
              count: 1,
            },
          ]),
          'randomId'
        ),
          done()
      })
  })

  it('#createAndSaveTimetable should correctly aggregate multiple stays at same hour and location', (done: DoneFn) => {
    service
      .createAndSaveTimetable([fixtures.threeTuesdaysNine], 'randomId')
      .then(() => {
        expect(dbServiceSpy.upsertTimetable).toHaveBeenCalledWith(
          jasmine.arrayContaining([
            {
              weekday: 2,
              hour: 9,
              inference: fixtures.threeTuesdaysNine.id,
              count: 3,
            },
          ]),
          'randomId'
        ),
          done()
      })
  })

  it('#createAndSaveTimetable should keep stays at same time from different POIs separate', (done: DoneFn) => {
    service
      .createAndSaveTimetable(
        [fixtures.threeTuesdaysNine, fixtures.twoTuesdaysNine],
        'randomId'
      )
      .then(() => {
        expect(dbServiceSpy.upsertTimetable).toHaveBeenCalledWith(
          jasmine.arrayContaining([
            {
              weekday: 2,
              hour: 9,
              inference: fixtures.threeTuesdaysNine.id,
              count: 3,
            },
            {
              weekday: 2,
              hour: 9,
              inference: fixtures.twoTuesdaysNine.id,
              count: 2,
            },
          ]),
          'randomId'
        ),
          done()
      })
  })
})
