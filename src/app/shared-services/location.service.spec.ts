import { TestBed } from '@angular/core/testing'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'
import { SqliteService } from './db/sqlite.service'
import { LocationService } from './location.service'

describe('LocationService', () => {
  let service: LocationService

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LocationService,
        BackgroundGeolocation,
        LocalNotifications,
        SqliteService,
      ],
    })
    service = TestBed.inject(LocationService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
