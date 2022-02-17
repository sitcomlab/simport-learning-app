import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { APP_TEST_IMPORTS } from 'src/app/app.declarations'
import { SqliteService } from 'src/app/shared-services/db/sqlite.service'
import { LocationService } from 'src/app/shared-services/location/location.service'
import { TrajectoryService } from 'src/app/shared-services/trajectory/trajectory.service'
import { InferenceFilterComponent } from './inference-filter.component'

describe('InferenceFilterComponent', () => {
  let component: InferenceFilterComponent
  let fixture: ComponentFixture<InferenceFilterComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InferenceFilterComponent],
      imports: APP_TEST_IMPORTS,
      providers: [
        TrajectoryService,
        SqliteService,
        LocationService,
        BackgroundGeolocation,
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(InferenceFilterComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
