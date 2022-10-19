import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonRouterOutlet } from '@ionic/angular'
import { APP_TEST_IMPORTS } from '../app.declarations'
import { SqliteService } from '../shared-services/db/sqlite.service'
import { LocationService } from '../shared-services/location/location.service'
import { TrajectoryImportExportService } from '../shared-services/trajectory/trajectory-import-export.service'
import { TrajectoryService } from '../shared-services/trajectory/trajectory.service'
import { SelectTrajectoryPage } from './select-trajectory.page'

describe('SelectTrajectoryPage', () => {
  let component: SelectTrajectoryPage
  let fixture: ComponentFixture<SelectTrajectoryPage>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [SelectTrajectoryPage],
        imports: APP_TEST_IMPORTS,
        providers: [
          LocationService,
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
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents()

      fixture = TestBed.createComponent(SelectTrajectoryPage)
      component = fixture.componentInstance
      fixture.detectChanges()
    })
  )

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
