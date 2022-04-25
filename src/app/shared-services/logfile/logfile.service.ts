import { Injectable } from '@angular/core'
import { Plugins } from '@capacitor/core'
import { Platform } from '@ionic/angular'
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
      this.log(LogEventType.start, LogEventScope.app, 'App started')

      App.addListener('appStateChange', async (state) => {
        this.log(
          state.isActive ? LogEventType.active : LogEventType.inactive,
          LogEventScope.app,
          'AppStateChange'
        )
      })
    })
  }

  log(
    type: LogEventType,
    scope: LogEventScope,
    text: string,
    level: LogEventLevel = LogEventLevel.info
  ) {
    const timestamp = new Date()
    this.trajectoryService.getFullUserTrack().subscribe((trajectory) => {
      const locationCount = trajectory.coordinates.length
      const lastTimestamp =
        trajectory.timestamps[trajectory.timestamps.length - 1]

      console.log(
        timestamp,
        type,
        scope,
        level,
        text,
        locationCount,
        lastTimestamp
      )
      // TODO: implement logging feature
      return
    })
  }

  warn(type: LogEventType, scope: LogEventScope, text: string) {
    this.log(type, scope, text, LogEventLevel.warn)
  }

  error(type: LogEventType, scope: LogEventScope, text: string) {
    this.log(type, scope, text, LogEventLevel.error)
  }

  exportLog() {
    // TODO: implement exporting feature
    return
  }
}
