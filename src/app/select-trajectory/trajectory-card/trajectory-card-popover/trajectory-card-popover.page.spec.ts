import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { SocialSharing } from '@ionic-native/social-sharing/ngx'
import { APP_TEST_IMPORTS } from 'src/app/app.declarations'
import { SqliteService } from 'src/app/shared-services/db/sqlite.service'
import { LocationService } from 'src/app/shared-services/location/location.service'
import { TrajectoryImportExportService } from 'src/app/shared-services/trajectory/trajectory-import-export.service'
import { TrajectoryService } from 'src/app/shared-services/trajectory/trajectory.service'
import { TrajectoryCardPopoverPage } from './trajectory-card-popover.page'

describe('TrajectoryCardPopoverPage', () => {
  let component: TrajectoryCardPopoverPage
  let fixture: ComponentFixture<TrajectoryCardPopoverPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TrajectoryCardPopoverPage],
      imports: APP_TEST_IMPORTS,
      providers: [
        AndroidPermissions,
        LocationService,
        BackgroundGeolocation,
        SqliteService,
        TrajectoryImportExportService,
        TrajectoryService,
        SocialSharing,
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(TrajectoryCardPopoverPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
