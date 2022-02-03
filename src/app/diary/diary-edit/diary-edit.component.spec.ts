import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { IonicModule } from '@ionic/angular'
import { SqliteService } from 'src/app/shared-services/db/sqlite.service'
import { DiaryService } from 'src/app/shared-services/diary/diary.service'

import { DiaryEditComponent } from './diary-edit.component'

describe('DiaryEditComponent', () => {
  let component: DiaryEditComponent
  let fixture: ComponentFixture<DiaryEditComponent>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [DiaryEditComponent],
        providers: [DiaryService, SqliteService],
        imports: [IonicModule.forRoot(), RouterTestingModule],
      }).compileComponents()

      fixture = TestBed.createComponent(DiaryEditComponent)
      component = fixture.componentInstance
      fixture.detectChanges()
    })
  )

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
