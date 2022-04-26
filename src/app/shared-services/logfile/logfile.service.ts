import { Injectable } from '@angular/core'
import {
  FilesystemDirectory,
  FilesystemEncoding,
  Plugins,
} from '@capacitor/core'
import { Platform } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'
import { LogEvent } from 'src/app/model/log-event'
import { SqliteService } from '../db/sqlite.service'
import { TrajectoryService } from '../trajectory/trajectory.service'
import { LogEventLevel, LogEventScope, LogEventType } from './types'
const { App, Filesystem, Share } = Plugins

@Injectable({
  providedIn: 'root',
})
export class LogfileService {
  constructor(
    private platform: Platform,
    private dbService: SqliteService,
    private trajectoryService: TrajectoryService,
    private translateService: TranslateService
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

  async exportLog() {
    try {
      const logs = await this.dbService.getLogs()
      const csvHeader = `${Object.getOwnPropertyNames(
        new (LogEvent as any)()
      ).join()}\n`

      const fileData =
        csvHeader + logs.map((l) => Object.values(l).join()).join('\n')

      const fileResult = await Filesystem.writeFile({
        data: fileData,
        path: `SIMPORT_log_${
          new Date().toISOString().replace(/:/g, '-').split('.')[0]
        }.csv`,
        directory: FilesystemDirectory.ExternalStorage,
        encoding: FilesystemEncoding.UTF8,
      })

      if (this.platform.is('android')) {
        await Share.requestPermissions()
      }

      Share.share({
        title: 'SIMPORT Log',
        url: fileResult.uri,
      })
    } catch (e) {
      const errorMessage = this.translateService.instant(
        'log.exportFileErrorTitle',
        { value: e.message }
      )
      throw new Error(errorMessage)
    }
  }
}
