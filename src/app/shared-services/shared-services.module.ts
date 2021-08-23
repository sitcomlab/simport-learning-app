import { CommonModule } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { InferenceService } from './inferences/inference.service'
import { SqliteService } from './db/sqlite.service'
import { LocationService } from './location.service'
import { TrajectoryImportExportService } from './trajectory/trajectory-import-export.service'
import { TrajectoryService } from './trajectory/trajectory.service'
import { StaypointDetector } from './staypoint/staypoint-detector'

@NgModule({
  providers: [
    // service dependencies
    BackgroundGeolocation,

    // providers
    InferenceService,
    LocationService,
    TrajectoryService,
    TrajectoryImportExportService,
    SqliteService,
    StaypointDetector,
  ],
  imports: [CommonModule, HttpClientModule],
})
export class SharedServicesModule {}
