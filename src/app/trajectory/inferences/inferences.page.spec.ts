import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { IonicModule } from '@ionic/angular'
import { InferencesPage } from './inferences.page'

describe('InferencesPage', () => {
  let component: InferencesPage
  let fixture: ComponentFixture<InferencesPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InferencesPage],
      imports: [IonicModule.forRoot(), RouterTestingModule],
    }).compileComponents()

    fixture = TestBed.createComponent(InferencesPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  }))

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
