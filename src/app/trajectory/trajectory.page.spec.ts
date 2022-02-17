import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { IonRouterOutlet } from '@ionic/angular'
import { SqliteService } from '../shared-services/db/sqlite.service'
import { FeatureFlagService } from '../shared-services/feature-flag/feature-flag.service'
import { LocationService } from '../shared-services/location/location.service'
import { TrajectoryImportExportService } from '../shared-services/trajectory/trajectory-import-export.service'
import { TrajectoryService } from '../shared-services/trajectory/trajectory.service'
import { TrajectoryPage } from './trajectory.page'
import { TranslateService } from '@ngx-translate/core'
import { APP_TEST_IMPORTS } from '../app.declarations'

describe('TrajectoryPage', () => {
  let component: TrajectoryPage
  let fixture: ComponentFixture<TrajectoryPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TrajectoryPage],
      imports: APP_TEST_IMPORTS,
      providers: [
        LocationService,
        BackgroundGeolocation,
        SqliteService,
        FeatureFlagService,
        TrajectoryService,
        TrajectoryImportExportService,
        {
          // use empty IonRouterOutlet, since actually providing IonRouterOutlet
          // creates a conflict with RouterTestingModule and this is sufficent for running tests.
          provide: IonRouterOutlet,
          useValue: { nativeEl: '' },
        },
        TranslateService,
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
