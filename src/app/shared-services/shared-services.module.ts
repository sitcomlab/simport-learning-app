import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { InferenceService } from './inferences/inference.service'
import { SqliteService } from './db/sqlite.service'
import { LocationService } from './location/location.service'
import { TrajectoryImportExportService } from './trajectory/trajectory-import-export.service'
import { TrajectoryService } from './trajectory/trajectory.service'
import { StaypointDetector } from './staypoint/staypoint-detector'
import { FeatureFlagService } from './feature-flag/feature-flag.service'
import { TimetableService } from './timetable/timetable.service'
import { BackgroundService } from './background/background.service'
import { DiaryService } from './diary/diary.service'
import { InformedConsentService } from './informed-consent/informed-consent.service'
import { LogfileService } from './logfile/logfile.service'

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
    FeatureFlagService,
    StaypointDetector,
    TimetableService,
    BackgroundService,
    DiaryService,
    InformedConsentService,
    LogfileService,
  ],
  imports: [CommonModule, FormsModule, HttpClientModule],
})
export class SharedServicesModule {}
