import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { TranslateService } from '@ngx-translate/core'
import { APP_TEST_IMPORTS } from 'src/app/app.declarations'

import { PausetimeSelectorComponent } from './pausetime-selector.component'

describe('PausetimeSelectorComponent', () => {
  let component: PausetimeSelectorComponent
  let fixture: ComponentFixture<PausetimeSelectorComponent>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [PausetimeSelectorComponent],
        imports: APP_TEST_IMPORTS,
        providers: [TranslateService],
      }).compileComponents()

      fixture = TestBed.createComponent(PausetimeSelectorComponent)
      component = fixture.componentInstance
      fixture.detectChanges()
    })
  )

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
