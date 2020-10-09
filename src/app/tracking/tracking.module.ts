import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { TrackingPageRoutingModule } from './tracking-routing.module'

import { TrackingPage } from './tracking.page'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TrackingPageRoutingModule],
  declarations: [TrackingPage],
  providers: [BackgroundGeolocation],
})
export class TrackingPageModule {}
