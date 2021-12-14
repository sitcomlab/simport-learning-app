import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { EditComponent } from './edit.component'

describe('EditComponent', () => {
  let component: EditComponent
  let fixture: ComponentFixture<EditComponent>

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [EditComponent],
        imports: [IonicModule.forRoot()],
      }).compileComponents()

      fixture = TestBed.createComponent(EditComponent)
      component = fixture.componentInstance
      fixture.detectChanges()
    })
  )

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
