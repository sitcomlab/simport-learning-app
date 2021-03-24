import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { IonicModule } from '@ionic/angular'

import { ItemCardComponent } from './item-card.component'

describe('ItemCardComponent', () => {
  let component: ItemCardComponent
  let fixture: ComponentFixture<ItemCardComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ItemCardComponent],
      imports: [IonicModule],
    }).compileComponents()

    fixture = TestBed.createComponent(ItemCardComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
