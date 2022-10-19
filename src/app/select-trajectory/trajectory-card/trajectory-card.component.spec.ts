import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { APP_TEST_IMPORTS } from 'src/app/app.declarations'
import { SqliteService } from 'src/app/shared-services/db/sqlite.service'
import { LocationService } from 'src/app/shared-services/location/location.service'
import { TrajectoryService } from 'src/app/shared-services/trajectory/trajectory.service'
import { TrajectoryCardComponent } from './trajectory-card.component'

describe('TrajectoryCardComponent', () => {
  let component: TrajectoryCardComponent
  let fixture: ComponentFixture<TrajectoryCardComponent>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [TrajectoryCardComponent],
        imports: APP_TEST_IMPORTS,
        providers: [TrajectoryService, SqliteService, LocationService],
      }).compileComponents()

      fixture = TestBed.createComponent(TrajectoryCardComponent)
      component = fixture.componentInstance
      fixture.detectChanges()
    })
  )

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
