import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { InferencesPage } from './inferences.page'
import { SqliteService } from 'src/app/shared-services/db/sqlite.service'
import { LocationService } from 'src/app/shared-services/location/location.service'
import { TrajectoryService } from 'src/app/shared-services/trajectory/trajectory.service'
import { APP_TEST_IMPORTS } from 'src/app/app.declarations'
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'

describe('InferencesPage', () => {
  let component: InferencesPage
  let fixture: ComponentFixture<InferencesPage>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [InferencesPage],
        imports: APP_TEST_IMPORTS,
        providers: [TrajectoryService, SqliteService, LocationService],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents()

      fixture = TestBed.createComponent(InferencesPage)
      component = fixture.componentInstance
      fixture.detectChanges()
    })
  )

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
