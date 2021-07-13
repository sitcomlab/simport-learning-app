import { HttpClientTestingModule } from '@angular/common/http/testing'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { IonicModule } from '@ionic/angular'
import { SqliteService } from 'src/app/shared-services/db/sqlite.service'
import { LocationService } from 'src/app/shared-services/location.service'
import { TrajectoryService } from 'src/app/shared-services/trajectory/trajectory.service'
import { TrajectorySelectorComponent } from './trajectory-selector.component'

describe('TrajectorySelectorComponent', () => {
  let component: TrajectorySelectorComponent
  let fixture: ComponentFixture<TrajectorySelectorComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TrajectorySelectorComponent],
      imports: [IonicModule, RouterTestingModule, HttpClientTestingModule],
      providers: [
        TrajectoryService,
        SqliteService,
        LocationService,
        BackgroundGeolocation,
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(TrajectorySelectorComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
