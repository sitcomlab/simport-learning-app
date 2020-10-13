import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { TrackingPageRoutingModule } from './tracking-routing.module'

import { TrackingPage } from './tracking.page'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'
import { SharedUiModule } from '../shared-ui/shared-ui.module'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TrackingPageRoutingModule,
    SharedUiModule,
  ],
  declarations: [TrackingPage],
  providers: [BackgroundGeolocation, LocalNotifications],
})
export class TrackingPageModule {}
