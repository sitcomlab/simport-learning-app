import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { APP_TEST_IMPORTS } from 'src/app/app.declarations'
import { SqliteService } from 'src/app/shared-services/db/sqlite.service'
import { LocationService } from 'src/app/shared-services/location/location.service'
import { TrajectoryImportExportService } from 'src/app/shared-services/trajectory/trajectory-import-export.service'
import { TrajectoryService } from 'src/app/shared-services/trajectory/trajectory.service'
import { TrajectoryCardPopoverPage } from './trajectory-card-popover.page'

describe('TrajectoryCardPopoverPage', () => {
  let component: TrajectoryCardPopoverPage
  let fixture: ComponentFixture<TrajectoryCardPopoverPage>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [TrajectoryCardPopoverPage],
        imports: APP_TEST_IMPORTS,
        providers: [
          LocationService,
          SqliteService,
          TrajectoryImportExportService,
          TrajectoryService,
        ],
      }).compileComponents()

      fixture = TestBed.createComponent(TrajectoryCardPopoverPage)
      component = fixture.componentInstance
      fixture.detectChanges()
    })
  )

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
