import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { APP_TEST_IMPORTS } from '../app.declarations'
import { SharedServicesModule } from './../shared-services/shared-services.module'

import { SettingsPage } from './settings.page'

describe('SettingsPage', () => {
  let component: SettingsPage
  let fixture: ComponentFixture<SettingsPage>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [SettingsPage],
        imports: [APP_TEST_IMPORTS, SharedServicesModule],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents()

      fixture = TestBed.createComponent(SettingsPage)
      component = fixture.componentInstance
      fixture.detectChanges()
    })
  )

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
