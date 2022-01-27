import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { APP_TEST_IMPORTS } from 'src/app/app.declarations'
import { SqliteService } from 'src/app/shared-services/db/sqlite.service'
import { DiaryService } from 'src/app/shared-services/diary/diary.service'

import { DiaryDetailComponent } from './diary-detail.component'

describe('DiaryDetailComponent', () => {
  let component: DiaryDetailComponent
  let fixture: ComponentFixture<DiaryDetailComponent>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [DiaryDetailComponent],
        imports: APP_TEST_IMPORTS,
        providers: [DiaryService, SqliteService],
      }).compileComponents()

      fixture = TestBed.createComponent(DiaryDetailComponent)
      component = fixture.componentInstance
      fixture.detectChanges()
    })
  )

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
