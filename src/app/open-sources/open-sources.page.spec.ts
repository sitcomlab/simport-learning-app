import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { OpenSourcesPage } from './open-sources.page'

describe('OpenSourcesPage', () => {
  let component: OpenSourcesPage
  let fixture: ComponentFixture<OpenSourcesPage>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [OpenSourcesPage],
        imports: [IonicModule.forRoot()],
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
