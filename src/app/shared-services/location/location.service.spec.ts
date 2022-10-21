import { TestBed } from '@angular/core/testing'
import { SqliteService } from '../db/sqlite.service'
import { LocationService } from './location.service'
import { TrajectoryService } from '../trajectory/trajectory.service'
import { NotificationService } from '../notification/notification.service'
import { TranslateService } from '@ngx-translate/core'
import { APP_TEST_IMPORTS } from 'src/app/app.declarations'

describe('LocationService', () => {
  let service: LocationService

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: APP_TEST_IMPORTS,
      providers: [
        LocationService,
        SqliteService,
        TrajectoryService,
        NotificationService,
        TranslateService,
      ],
    })
    service = TestBed.inject(LocationService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
