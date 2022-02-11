import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'

import { TrackingPageRoutingModule } from './tracking-routing.module'
import { TrackingPage } from './tracking.page'
import { SharedUiModule } from '../shared-ui/shared-ui.module'
import { TranslateModule } from '@ngx-translate/core'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TrackingPageRoutingModule,
    SharedUiModule,
    TranslateModule,
  ],
  declarations: [TrackingPage],
})
export class TrackingPageModule {}
