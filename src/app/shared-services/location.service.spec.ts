import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'
import { SqliteService } from './db/sqlite.service'
import { LocationService } from './location.service'
import { TrajectoryService } from './trajectory/trajectory.service'

describe('LocationService', () => {
  let service: LocationService

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LocationService,
        BackgroundGeolocation,
        LocalNotifications,
        SqliteService,
        TrajectoryService,
      ],
    })
    service = TestBed.inject(LocationService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
