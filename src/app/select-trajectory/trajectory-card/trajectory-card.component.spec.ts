import { HttpClientTestingModule } from '@angular/common/http/testing'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'
import { IonicModule } from '@ionic/angular'
import { SqliteService } from 'src/app/shared-services/db/sqlite.service'
import { LocationService } from 'src/app/shared-services/location.service'
import { TrajectoryService } from 'src/app/shared-services/trajectory.service'
import { TrajectoryCardComponent } from './trajectory-card.component'

describe('TrajectoryCardComponent', () => {
  let component: TrajectoryCardComponent
  let fixture: ComponentFixture<TrajectoryCardComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TrajectoryCardComponent],
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule,
        HttpClientTestingModule,
      ],
      providers: [
        TrajectoryService,
        SqliteService,
        LocationService,
        BackgroundGeolocation,
        LocalNotifications,
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(TrajectoryCardComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
