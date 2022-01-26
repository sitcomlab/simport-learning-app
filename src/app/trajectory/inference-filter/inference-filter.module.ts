import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { InferenceFilterComponent } from './inference-filter.component'
import { SharedUiModule } from 'src/app/shared-ui/shared-ui.module'
import { TranslateModule } from '@ngx-translate/core'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedUiModule,
    TranslateModule,
  ],
  declarations: [InferenceFilterComponent],
})
export class InferenceFilterModule {}
