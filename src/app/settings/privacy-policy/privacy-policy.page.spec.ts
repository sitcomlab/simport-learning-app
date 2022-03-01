import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { APP_TEST_IMPORTS } from 'src/app/app.declarations'

import { PrivacyPolicyPage } from './privacy-policy.page'

describe('PrivacyPolicyPage', () => {
  let component: PrivacyPolicyPage
  let fixture: ComponentFixture<PrivacyPolicyPage>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [PrivacyPolicyPage],
        imports: APP_TEST_IMPORTS,
      }).compileComponents()

      fixture = TestBed.createComponent(PrivacyPolicyPage)
      component = fixture.componentInstance
      fixture.detectChanges()
    })
  )

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
