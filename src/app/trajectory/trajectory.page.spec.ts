import { HttpClientTestingModule } from '@angular/common/http/testing'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { IonicModule, IonRouterOutlet } from '@ionic/angular'
import { SqliteService } from '../shared-services/db/sqlite.service'
import { LocationService } from '../shared-services/location/location.service'
import { TrajectoryImportExportService } from '../shared-services/trajectory/trajectory-import-export.service'
import { TrajectoryService } from '../shared-services/trajectory/trajectory.service'
import { TrajectoryPage } from './trajectory.page'

describe('TrajectoryPage', () => {
  let component: TrajectoryPage
  let fixture: ComponentFixture<TrajectoryPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TrajectoryPage],
      imports: [IonicModule, RouterTestingModule, HttpClientTestingModule],
      providers: [
        LocationService,
        BackgroundGeolocation,
        SqliteService,
        TrajectoryService,
        TrajectoryImportExportService,
        {
          // use empty IonRouterOutlet, since actually providing IonRouterOutlet
          // creates a conflict with RouterTestingModule and this is sufficent for running tests.
          provide: IonRouterOutlet,
          useValue: { nativeEl: '' },
        },
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(TrajectoryPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
