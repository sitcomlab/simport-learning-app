import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { LicensesPage } from './licenses.page'

describe('LicensesPage', () => {
  let component: LicensesPage
  let fixture: ComponentFixture<LicensesPage>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [LicensesPage],
        imports: [IonicModule.forRoot()],
      }).compileComponents()

      fixture = TestBed.createComponent(LicensesPage)
      component = fixture.componentInstance
      fixture.detectChanges()
    })
  )

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
