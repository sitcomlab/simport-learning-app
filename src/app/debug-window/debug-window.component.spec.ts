import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { APP_TEST_IMPORTS } from '../app.declarations'
import { SqliteService } from '../shared-services/db/sqlite.service'
import { LocationService } from '../shared-services/location/location.service'
import { TrajectoryService } from '../shared-services/trajectory/trajectory.service'

import { DebugWindowComponent } from './debug-window.component'

describe('DebugWindowComponent', () => {
  let component: DebugWindowComponent
  let fixture: ComponentFixture<DebugWindowComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DebugWindowComponent],
      imports: APP_TEST_IMPORTS,
      providers: [
        TrajectoryService,
        SqliteService,
        LocationService,
        BackgroundGeolocation,
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
