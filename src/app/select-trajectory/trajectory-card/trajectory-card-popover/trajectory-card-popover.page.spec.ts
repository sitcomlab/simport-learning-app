import { HttpClientTestingModule } from '@angular/common/http/testing'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'
import { SocialSharing } from '@ionic-native/social-sharing/ngx'
import { IonicModule } from '@ionic/angular'
import { SqliteService } from 'src/app/shared-services/db/sqlite.service'
import { LocationService } from 'src/app/shared-services/location.service'
import { TrajectoryImportExportService } from 'src/app/shared-services/trajectory-import-export.service'
import { TrajectoryCardPopoverPage } from './trajectory-card-popover.page'

describe('TrajectoryCardPopoverPage', () => {
  let component: TrajectoryCardPopoverPage
  let fixture: ComponentFixture<TrajectoryCardPopoverPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TrajectoryCardPopoverPage],
      imports: [IonicModule.forRoot(), HttpClientTestingModule],
      providers: [
        AndroidPermissions,
        LocationService,
        BackgroundGeolocation,
        LocalNotifications,
        SqliteService,
        TrajectoryImportExportService,
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
