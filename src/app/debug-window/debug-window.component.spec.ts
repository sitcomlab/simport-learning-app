import { HttpClientTestingModule } from '@angular/common/http/testing'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'
import { IonicModule } from '@ionic/angular'
import { SqliteService } from '../shared-services/db/sqlite.service'
import { LocationService } from '../shared-services/location.service'
import { TrajectoryService } from '../shared-services/trajectory/trajectory.service'

import { DebugWindowComponent } from './debug-window.component'

describe('DebugWindowComponent', () => {
  let component: DebugWindowComponent
  let fixture: ComponentFixture<DebugWindowComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DebugWindowComponent],
      imports: [IonicModule.forRoot(), HttpClientTestingModule],
      providers: [
        TrajectoryService,
        SqliteService,
        LocationService,
        BackgroundGeolocation,
        LocalNotifications,
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(DebugWindowComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
