import { HttpClientTestingModule } from '@angular/common/http/testing'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'
import { IonicModule } from '@ionic/angular'
import { SqliteService } from '../shared-services/db/sqlite.service'
import { LocationService } from '../shared-services/location.service'
import { TrajectoryService } from '../shared-services/trajectory/trajectory.service'
import { TrackingPage } from './tracking.page'

describe('TrackingPage', () => {
  let component: TrackingPage
  let fixture: ComponentFixture<TrackingPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TrackingPage],
      imports: [IonicModule, RouterTestingModule, HttpClientTestingModule],
      providers: [
        LocationService,
        TrajectoryService,
        BackgroundGeolocation,
        LocalNotifications,
        SqliteService,
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(TrackingPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
