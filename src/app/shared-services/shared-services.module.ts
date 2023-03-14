import { CommonModule } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { SqliteService } from './db/sqlite.service'
import { LocationService } from './location/location.service'
import { TrajectoryImportExportService } from './trajectory/trajectory-import-export.service'
import { TrajectoryService } from './trajectory/trajectory.service'
import { StaypointDetector } from './staypoint/staypoint-detector'
import { FeatureFlagService } from './feature-flag/feature-flag.service'
import { TimetableService } from './timetable/timetable.service'
import { BackgroundService } from './background/background.service'
import { DiaryService } from './diary/diary.service'
import { SettingsService } from './settings/settings.service'
import { LogfileService } from './logfile/logfile.service'

@NgModule({
  providers: [
    LocationService,
    TrajectoryService,
    TrajectoryImportExportService,
    SqliteService,
    FeatureFlagService,
    StaypointDetector,
    TimetableService,
    BackgroundService,
    DiaryService,
    SettingsService,
    LogfileService,
  ],
  imports: [CommonModule, HttpClientModule],
})
export class SharedServicesModule {}
