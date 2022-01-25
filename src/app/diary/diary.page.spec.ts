import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { RouterModule } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { IonicModule } from '@ionic/angular'
import { SqliteService } from '../shared-services/db/sqlite.service'

import { DiaryPage } from './diary.page'

describe('DiaryPage', () => {
  let component: DiaryPage
  let fixture: ComponentFixture<DiaryPage>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [DiaryPage],
        imports: [IonicModule.forRoot(), RouterTestingModule],
        providers: [SqliteService],
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
