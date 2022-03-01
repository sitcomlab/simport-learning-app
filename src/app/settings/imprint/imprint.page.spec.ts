import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { APP_TEST_IMPORTS } from 'src/app/app.declarations'

import { ImprintPage } from './imprint.page'

describe('ImprintPage', () => {
  let component: ImprintPage
  let fixture: ComponentFixture<ImprintPage>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ImprintPage],
        imports: APP_TEST_IMPORTS,
      }).compileComponents()

      fixture = TestBed.createComponent(ImprintPage)
      component = fixture.componentInstance
      fixture.detectChanges()
    })
  )

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
