import { CommonModule } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'
import { InferenceService } from './inferences/inference.service'
import { SqliteService } from './db/sqlite.service'
import { LocationService } from './location.service'
import { TrajectoryImportExportService } from './trajectory-import-export.service'
import { TrajectoryService } from './trajectory.service'

@NgModule({
  providers: [
    // service dependencies
    BackgroundGeolocation,
    LocalNotifications,

    // providers
    InferenceService,
    LocationService,
    TrajectoryService,
    TrajectoryImportExportService,
    SqliteService,
  ],
  imports: [CommonModule, HttpClientModule],
})
export class SharedServicesModule {}
