import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { APP_TEST_IMPORTS } from 'src/app/app.declarations'

import { OpenSourcesPage } from './open-sources.page'

describe('OpenSourcesPage', () => {
  let component: OpenSourcesPage
  let fixture: ComponentFixture<OpenSourcesPage>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [OpenSourcesPage],
        imports: APP_TEST_IMPORTS,
      }).compileComponents()

      fixture = TestBed.createComponent(OpenSourcesPage)
      component = fixture.componentInstance
      fixture.detectChanges()
    })
  )

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
