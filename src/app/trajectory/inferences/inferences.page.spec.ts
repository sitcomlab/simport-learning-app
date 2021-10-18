import { HttpClientTestingModule } from '@angular/common/http/testing'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { IonicModule } from '@ionic/angular'
import { InferencesPage } from './inferences.page'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { SqliteService } from 'src/app/shared-services/db/sqlite.service'
import { LocationService } from 'src/app/shared-services/location/location.service'
import { TrajectoryService } from 'src/app/shared-services/trajectory/trajectory.service'

describe('InferencesPage', () => {
  let component: InferencesPage
  let fixture: ComponentFixture<InferencesPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InferencesPage],
      imports: [
        IonicModule.forRoot(),
        RouterTestingModule,
        HttpClientTestingModule,
      ],
      providers: [
        TrajectoryService,
        SqliteService,
        LocationService,
        BackgroundGeolocation,
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(InferencesPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
