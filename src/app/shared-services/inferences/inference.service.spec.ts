import { TestBed } from '@angular/core/testing'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'

import { APP_TEST_IMPORTS } from 'src/app/app.declarations'
import { SqliteService } from 'src/app/shared-services/db/sqlite.service'
import { LocationService } from 'src/app/shared-services/location/location.service'
import { TrajectoryService } from 'src/app/shared-services/trajectory/trajectory.service'
import { FeatureFlagService } from '../feature-flag/feature-flag.service'
import { InferenceService } from './inference.service'

describe('InferenceService', () => {
  let service: InferenceService

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: APP_TEST_IMPORTS,
      providers: [
        TrajectoryService,
        SqliteService,
        LocationService,
        BackgroundGeolocation,
        TrajectoryService,
        FeatureFlagService,
      ],
    })
    service = TestBed.inject(InferenceService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
