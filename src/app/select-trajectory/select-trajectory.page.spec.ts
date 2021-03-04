import { HttpClientTestingModule } from '@angular/common/http/testing'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'
import { IonicModule, IonRouterOutlet } from '@ionic/angular'
import { SqliteService } from '../shared-services/db/sqlite.service'
import { LocationService } from '../shared-services/location.service'
import { SelectTrajectoryPage } from './select-trajectory.page'

describe('SelectTrajectoryPage', () => {
  let component: SelectTrajectoryPage
  let fixture: ComponentFixture<SelectTrajectoryPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SelectTrajectoryPage],
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule,
        HttpClientTestingModule,
      ],
      providers: [
        LocationService,
        BackgroundGeolocation,
        LocalNotifications,
        SqliteService,
        {
          // use empty IonRouterOutlet, since actually providing IonRouterOutlet
          // creates a conflict with RouterTestingModule and this is sufficent for running tests.
          provide: IonRouterOutlet,
          useValue: { nativeEl: '' },
        },
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(SelectTrajectoryPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
