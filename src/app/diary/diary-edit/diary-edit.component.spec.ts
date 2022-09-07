import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { APP_TEST_IMPORTS } from 'src/app/app.declarations'
import { SqliteService } from 'src/app/shared-services/db/sqlite.service'
import { DiaryService } from 'src/app/shared-services/diary/diary.service'
import { TrajectoryService } from 'src/app/shared-services/trajectory/trajectory.service'

import { DiaryEditComponent } from './diary-edit.component'

describe('DiaryEditComponent', () => {
  let component: DiaryEditComponent
  let fixture: ComponentFixture<DiaryEditComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DiaryEditComponent],
      providers: [DiaryService, TrajectoryService, SqliteService],
      imports: APP_TEST_IMPORTS,
    }).compileComponents()

    fixture = TestBed.createComponent(DiaryEditComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
