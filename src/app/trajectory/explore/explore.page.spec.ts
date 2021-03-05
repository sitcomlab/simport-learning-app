import { HttpClientTestingModule } from '@angular/common/http/testing'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { IonicModule } from '@ionic/angular'

import { ExplorePage } from './explore.page'

describe('ExplorePage', () => {
  let component: ExplorePage
  let fixture: ComponentFixture<ExplorePage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ExplorePage],
      imports: [
        IonicModule.forRoot(),
        HttpClientTestingModule,
        RouterTestingModule,
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(ExplorePage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
