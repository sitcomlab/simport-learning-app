import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { IonicModule } from '@ionic/angular'
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
        imports: [IonicModule.forRoot(), RouterTestingModule],
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
