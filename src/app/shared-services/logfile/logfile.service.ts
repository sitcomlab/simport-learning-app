import { Injectable } from '@angular/core'
import { Plugins } from '@capacitor/core'
import { Platform } from '@ionic/angular'
import { LogEvent } from 'src/app/model/log-event'
import { SqliteService } from '../db/sqlite.service'
import { TrajectoryService } from '../trajectory/trajectory.service'
import { LogEventLevel, LogEventScope, LogEventType } from './types'
const { App } = Plugins

@Injectable({
  providedIn: 'root',
})
export class LogfileService {
  constructor(
    private platform: Platform,
    private dbService: SqliteService,
    private trajectoryService: TrajectoryService
  ) {
    this.platform.ready().then(() => {
      this.log('App started', LogEventScope.app, LogEventType.start)

      App.addListener('appStateChange', async (state) => {
        this.log(
          'AppStateChange',
          LogEventScope.app,
          state.isActive ? LogEventType.active : LogEventType.inactive
        )
      })
    })
  }

  log(
    text: string,
    scope: LogEventScope = LogEventScope.other,
    type: LogEventType = LogEventType.other,
    level: LogEventLevel = LogEventLevel.info
  ) {
    const timestamp = new Date()
    this.trajectoryService.getFullUserTrack().subscribe((trajectory) => {
      const locationCount = trajectory.coordinates.length
      const lastLocationTimestamp =
        trajectory.timestamps[trajectory.timestamps.length - 1]

      this.dbService.upsertLogEntry({
        type,
        scope,
        level,
        text,
        timestamp,
        locationCount,
        lastLocationTimestamp,
      })
    })
  }

  exportLog(): Promise<LogEvent[]> {
    return this.dbService.getLogs()
  }
}
