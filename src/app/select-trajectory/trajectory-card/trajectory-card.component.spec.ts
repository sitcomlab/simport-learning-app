import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { TrajectoryCardComponent } from './trajectory-card.component'

describe('TrajectoryCardComponent', () => {
  let component: TrajectoryCardComponent
  let fixture: ComponentFixture<TrajectoryCardComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TrajectoryCardComponent],
      imports: [IonicModule.forRoot()],
    }).compileComponents()

    fixture = TestBed.createComponent(TrajectoryCardComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
