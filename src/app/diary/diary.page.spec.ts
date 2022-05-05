import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { APP_TEST_IMPORTS } from '../app.declarations'
import { SqliteService } from '../shared-services/db/sqlite.service'
import { TrajectoryService } from '../shared-services/trajectory/trajectory.service'

import { DiaryPage } from './diary.page'

describe('DiaryPage', () => {
  let component: DiaryPage
  let fixture: ComponentFixture<DiaryPage>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [DiaryPage],
        imports: APP_TEST_IMPORTS,
        providers: [SqliteService, TrajectoryService],
      }).compileComponents()

      fixture = TestBed.createComponent(DiaryPage)
      component = fixture.componentInstance
      fixture.detectChanges()
    })
  )

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
