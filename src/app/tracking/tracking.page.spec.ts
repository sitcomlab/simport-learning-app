import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { APP_TEST_IMPORTS } from '../app.declarations'
import { SqliteService } from '../shared-services/db/sqlite.service'
import { LocationService } from '../shared-services/location/location.service'
import { TrajectoryService } from '../shared-services/trajectory/trajectory.service'
import { TrackingPage } from './tracking.page'

describe('TrackingPage', () => {
  let component: TrackingPage
  let fixture: ComponentFixture<TrackingPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TrackingPage],
      imports: APP_TEST_IMPORTS,
      providers: [
        LocationService,
        TrajectoryService,
        BackgroundGeolocation,
        SqliteService,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(TrackingPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
