import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'
import { SqliteService } from 'src/app/shared-services/db/sqlite.service'
import { LocationService } from 'src/app/shared-services/location.service'
import { TrajectoryService } from 'src/app/shared-services/trajectory/trajectory.service'

import { InferenceService } from './inference.service'

describe('InferenceService', () => {
  let service: InferenceService

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TrajectoryService,
        SqliteService,
        LocationService,
        BackgroundGeolocation,
        LocalNotifications,
      ],
    })
    service = TestBed.inject(InferenceService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
