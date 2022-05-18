import { HttpClientTestingModule } from '@angular/common/http/testing'
import { FormsModule } from '@angular/forms'
import { RouterTestingModule } from '@angular/router/testing'
import { IonicModule } from '@ionic/angular'
import { TranslateModule } from '@ngx-translate/core'

export const APP_TEST_IMPORTS = [
  IonicModule.forRoot(),
  TranslateModule.forRoot(),
  HttpClientTestingModule,
  RouterTestingModule,
  FormsModule,
]
