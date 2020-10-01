import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { TrajectoryPage } from './trajectory.page'

describe('TrajectoryPage', () => {
  let component: TrajectoryPage
  let fixture: ComponentFixture<TrajectoryPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TrajectoryPage],
      imports: [IonicModule.forRoot()],
    }).compileComponents()

    fixture = TestBed.createComponent(TrajectoryPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
