import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { InferencesPageRoutingModule } from './inferences-routing.module'

import { InferencesPage } from './inferences.page'
import { SharedUiModule } from 'src/app/shared-ui/shared-ui.module'
import { TranslateModule } from '@ngx-translate/core'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InferencesPageRoutingModule,
    SharedUiModule,
    TranslateModule,
  ],
  declarations: [InferencesPage],
})
export class InferencesPageModule {}
