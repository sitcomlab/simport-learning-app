import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { TrajectorySelectorComponent } from './trajectory-selector.component'

describe('TrajectorySelectorComponent', () => {
  let component: TrajectorySelectorComponent
  let fixture: ComponentFixture<TrajectorySelectorComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TrajectorySelectorComponent],
      imports: [IonicModule.forRoot()],
    }).compileComponents()

    fixture = TestBed.createComponent(TrajectorySelectorComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
