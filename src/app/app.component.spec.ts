import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { TestBed, waitForAsync } from '@angular/core/testing'
import { Platform } from '@ionic/angular'
import { AppComponent } from './app.component'
import { TranslateModule } from '@ngx-translate/core'

describe('AppComponent', () => {
  let platformReadySpy
  let platformSpy

  beforeEach(
    waitForAsync(() => {
      platformReadySpy = Promise.resolve()
      platformSpy = jasmine.createSpyObj('Platform', {
        ready: platformReadySpy,
      })

      TestBed.configureTestingModule({
        imports: [TranslateModule.forRoot()],
        declarations: [AppComponent],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        providers: [{ provide: Platform, useValue: platformSpy }],
      }).compileComponents()
    })
  )

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent)
    const app = fixture.debugElement.componentInstance
    expect(app).toBeTruthy()
  })

  // TODO: add more tests!
})
