import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { NgApexchartsModule } from 'ng-apexcharts'

import { ExplorePageRoutingModule } from './explore-routing.module'

import { ExplorePage } from './explore.page'
import { TranslateModule } from '@ngx-translate/core'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ExplorePageRoutingModule,
    NgApexchartsModule,
    TranslateModule,
  ],
  declarations: [ExplorePage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ExplorePageModule {}
