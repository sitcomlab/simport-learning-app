import { TestBed } from '@angular/core/testing'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { APP_TEST_IMPORTS } from 'src/app/app.declarations'
import { SqliteService } from './../db/sqlite.service'
import { LocationService } from './../location/location.service'
import { TrajectoryService } from './trajectory.service'

describe('TrajectoryService', () => {
  let service: TrajectoryService

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: APP_TEST_IMPORTS,
      providers: [
        TrajectoryService,
        SqliteService,
        LocationService,
        BackgroundGeolocation,
      ],
    })
    service = TestBed.inject(TrajectoryService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
