import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { SharedUiModule } from 'src/app/shared-ui/shared-ui.module'
import { TranslateModule } from '@ngx-translate/core'
import { InferenceModalComponent } from './inferences-modal.component'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedUiModule,
    TranslateModule,
  ],
  declarations: [InferenceModalComponent],
})
export class InferenceModalModule {}
