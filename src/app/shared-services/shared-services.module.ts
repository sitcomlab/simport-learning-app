import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx';
import { LocalNotifications } from '@ionic-native/local-notifications/ngx';
import { LocationService } from './location.service';
import { TrajectoryService } from './trajectory.service';


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
    HttpClientModule,
  ],
})
export class SharedServicesModule { }
