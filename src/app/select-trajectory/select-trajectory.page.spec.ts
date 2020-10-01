import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { SelectTrajectoryPage } from './select-trajectory.page'

describe('SelectTrajectoryPage', () => {
  let component: SelectTrajectoryPage
  let fixture: ComponentFixture<SelectTrajectoryPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SelectTrajectoryPage],
      imports: [IonicModule.forRoot()],
    }).compileComponents()

    fixture = TestBed.createComponent(SelectTrajectoryPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
