import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx';
import { LocalNotifications } from '@ionic-native/local-notifications/ngx';

import { TrajectoryService } from './trajectory.service';
import { LocationService } from './location.service';

@NgModule({
  providers: [
    // service dependencies
    BackgroundGeolocation,
    LocalNotifications,

    // providers
    LocationService,
    TrajectoryService,
  ],
  imports: [
    CommonModule,
  ],
})
export class SharedServicesModule { }
