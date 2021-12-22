import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { NgApexchartsModule } from 'ng-apexcharts'

import { ExplorePageRoutingModule } from './explore-routing.module'

import { ExplorePage } from './explore.page'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ExplorePageRoutingModule,
    NgApexchartsModule,
  ],
  declarations: [ExplorePage],
})
export class ExplorePageModule {}
