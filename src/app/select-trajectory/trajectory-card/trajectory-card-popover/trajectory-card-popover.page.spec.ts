import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { TrajectoryCardPopoverPage } from './trajectory-card-popover.page'

describe('TrajectoryCardPopoverPage', () => {
  let component: TrajectoryCardPopoverPage
  let fixture: ComponentFixture<TrajectoryCardPopoverPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TrajectoryCardPopoverPage],
      imports: [IonicModule.forRoot()],
    }).compileComponents()

    fixture = TestBed.createComponent(TrajectoryCardPopoverPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
