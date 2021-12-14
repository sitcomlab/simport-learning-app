import { HttpClientTestingModule } from '@angular/common/http/testing'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { IonicModule } from '@ionic/angular'
import { SqliteService } from 'src/app/shared-services/db/sqlite.service'
import { InferenceService } from 'src/app/shared-services/inferences/inference.service'
import { TimetableService } from 'src/app/shared-services/timetable/timetable.service'
import { TrajectoryService } from 'src/app/shared-services/trajectory/trajectory.service'

import { ExplorePage } from './explore.page'

describe('ExplorePage', () => {
  let component: ExplorePage
  let fixture: ComponentFixture<ExplorePage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ExplorePage],
      imports: [IonicModule, HttpClientTestingModule, RouterTestingModule],
      providers: [
        TimetableService,
        InferenceService,
        SqliteService,
        TrajectoryService,
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(ExplorePage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
