import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { OpenSourcesPageRoutingModule } from './open-sources-routing.module'

import { OpenSourcesPage } from './open-sources.page'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OpenSourcesPageRoutingModule,
  ],
  declarations: [OpenSourcesPage],
})
export class OpenSourcesPageModule {}
