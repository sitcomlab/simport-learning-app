import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { APP_TEST_IMPORTS } from 'src/app/app.declarations'
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
      imports: APP_TEST_IMPORTS,
      providers: [
        TimetableService,
        InferenceService,
        SqliteService,
        TrajectoryService,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents()

    fixture = TestBed.createComponent(ExplorePage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
