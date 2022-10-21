import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { LeafletModule } from '@asymmetrik/ngx-leaflet'
import { IonRouterOutlet } from '@ionic/angular'
import { APP_TEST_IMPORTS } from 'src/app/app.declarations'
import { FeatureFlagService } from 'src/app/shared-services/feature-flag/feature-flag.service'
import { SqliteService } from '../../shared-services/db/sqlite.service'
import { LocationService } from '../../shared-services/location/location.service'
import { TrajectoryService } from '../../shared-services/trajectory/trajectory.service'
import { MapPage } from './map.page'

describe('MapPage', () => {
  let component: MapPage
  let fixture: ComponentFixture<MapPage>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [MapPage],
        imports: [APP_TEST_IMPORTS, LeafletModule],
        providers: [
          LocationService,
          TrajectoryService,
          SqliteService,
          {
            // use empty IonRouterOutlet, since actually providing IonRouterOutlet
            // creates a conflict with RouterTestingModule and this is sufficent for running tests.
            provide: IonRouterOutlet,
            useValue: { nativeEl: '' },
          },
          FeatureFlagService,
        ],
      }).compileComponents()

      fixture = TestBed.createComponent(MapPage)
      component = fixture.componentInstance
      fixture.detectChanges()
    })
  )

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
