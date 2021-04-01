import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { DebugWindowComponent } from './debug-window.component'

describe('DebugWindowComponent', () => {
  let component: DebugWindowComponent
  let fixture: ComponentFixture<DebugWindowComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DebugWindowComponent],
      imports: [IonicModule.forRoot()],
    }).compileComponents()

    fixture = TestBed.createComponent(DebugWindowComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
