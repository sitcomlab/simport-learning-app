import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { MapPageRoutingModule } from './map-routing.module'

import { MapPage } from './map.page'
import { LeafletModule } from '@asymmetrik/ngx-leaflet'
import { TranslateModule } from '@ngx-translate/core'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MapPageRoutingModule,
    LeafletModule,
    TranslateModule,
  ],
  declarations: [MapPage],
})
export class MapPageModule {}
