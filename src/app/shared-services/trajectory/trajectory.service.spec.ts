import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'
import { SqliteService } from './../db/sqlite.service'
import { LocationService } from './../location.service'
import { TrajectoryService } from './trajectory.service'

describe('TrajectoryService', () => {
  let service: TrajectoryService

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
    service = TestBed.inject(TrajectoryService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
