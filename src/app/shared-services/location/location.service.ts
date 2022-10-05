import { Injectable, OnDestroy } from '@angular/core'
import { AlertController, Platform } from '@ionic/angular'
import { BehaviorSubject, Subscription } from 'rxjs'
import { Trajectory, TrajectoryType, PointState } from '../../model/trajectory'
import { SqliteService } from './../db/sqlite.service'
import { InferenceService } from './../inferences/inference.service'
import { NotificationService } from './../notification/notification.service'
import { NotificationType } from './../notification/types'
import { Plugins } from '@capacitor/core'
import { TranslateService } from '@ngx-translate/core'
import { LogfileService } from '../logfile/logfile.service'
import { LogEventScope, LogEventType } from '../logfile/types'
import {
  BackgroundGeolocationPlugin,
  Location,
} from '@capacitor-community/background-geolocation'

// eslint-disable-next-line @typescript-eslint/naming-convention
const { App, BackgroundGeolocation } = Plugins
@Injectable()
export class LocationService implements OnDestroy {
  trackingRunning: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  )
  notificationsEnabled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  )

  private locationUpdateSubscription: BehaviorSubject<Location> =
    new BehaviorSubject<Location>(undefined)
  private startEventSubscription: BehaviorSubject<'START' | 'STOP'> =
    new BehaviorSubject<'START' | 'STOP'>(undefined)
  private stopEventSubscription: Subscription
  private nextLocationIsStart = false

  private backgroundGeolocation: BackgroundGeolocationPlugin =
    BackgroundGeolocation as BackgroundGeolocationPlugin
  private backgroundGeolocationWatcherId: string

  constructor(
    private platform: Platform,
    private dbService: SqliteService,
    private inferenceService: InferenceService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private alertController: AlertController,
    private logfileService: LogfileService
  ) {
    if (!this.isSupportedPlatform) return

    if (this.isRunning) this.nextLocationIsStart = true

    this.subscribeToLocationUpdates()
    this.subscribeToStartStopEvents()
    this.updateRunningState()

    App.addListener('appStateChange', (state) => {
      if (state.isActive) {
        this.updateRunningState()
      }
    })
  }

  get isSupportedPlatform(): boolean {
    return this.platform.is('ios') || this.platform.is('android')
  }

  get isRunning(): boolean {
    return this.backgroundGeolocationWatcherId !== undefined
  }

  ngOnDestroy() {
    if (this.locationUpdateSubscription) {
      this.locationUpdateSubscription.unsubscribe()
    }
    if (this.startEventSubscription) {
      this.startEventSubscription.unsubscribe()
    }
    if (this.stopEventSubscription) {
      this.stopEventSubscription.unsubscribe()
    }
  }

  enableNotifications(enabled: boolean) {
    this.notificationsEnabled.next(enabled)
  }

  start() {
    this.logfileService.log(
      'Tracking started',
      LogEventScope.tracking,
      LogEventType.start
    )
    if (!this.isSupportedPlatform) return

    if (this.isRunning) {
      this.stop()
      return false
    }

    this.backgroundGeolocationWatcherId = this.backgroundGeolocation.addWatcher(
      {
        backgroundMessage: 'Cancel to prevent battery drain.',
        backgroundTitle: 'Tracking You.',
        requestPermissions: true,
        stale: false,
        distanceFilter: 30,
      },
      async (location, error) => {
        if (error) {
          if (error.code === 'NOT_AUTHORIZED') {
            await this.showGrantPermissionAlert()
          }
          return console.error(error)
        }

        this.locationUpdateSubscription.next(location)
      }
    )
    this.nextLocationIsStart = true
    this.notificationService.removeScheduledUnpauseNotifications()
    this.startEventSubscription.next('START')
  }

  stop() {
    this.logfileService.log(
      'Tracking stopped',
      LogEventScope.tracking,
      LogEventType.stop
    )

    if (!this.isSupportedPlatform) return

    this.backgroundGeolocation
      .removeWatcher({
        id: this.backgroundGeolocationWatcherId,
      })
      .then(() => {
        this.backgroundGeolocationWatcherId = undefined
        this.nextLocationIsStart = false
        this.startEventSubscription.next('STOP')
      })
  }

  sendUnpauseNotificationAtTime(unpauseDate: Date) {
    this.notificationService.notifyAtTime(
      NotificationType.unpauseTrackingNotification,
      this.translateService.instant('notification.trackingUnpausedTitle'),
      this.translateService.instant('notification.trackingUnpausedText'),
      unpauseDate
    )
  }

  openLocationSettings() {
    this.backgroundGeolocation.openSettings()
  }

  private updateRunningState() {
    this.trackingRunning.next(this.isRunning)
  }

  private subscribeToLocationUpdates() {
    this.locationUpdateSubscription.subscribe(async (location) => {
      if (!location) return

      const { latitude, longitude, time, accuracy, speed } = location

      const state = this.nextLocationIsStart ? PointState.START : null
      await this.dbService.upsertPoint(Trajectory.trackingTrajectoryID, {
        latLng: [latitude, longitude],
        time: new Date(time),
        accuracy,
        speed,
        state,
      })
      this.nextLocationIsStart = false

      await this.inferenceService.triggerBackgroundFunctionIfViable()

      this.logfileService.log(
        'Location update',
        LogEventScope.tracking,
        LogEventType.change
      )

      this.sendNotification(
        this.translateService.instant('notification.locationUpdateTitle'),
        this.translateService.instant('notification.locationUpdateText', {
          latitude: latitude.toFixed(4),
          longitude: longitude.toFixed(4),
          accuracy: accuracy.toFixed(1),
        })
      )
    })
  }

  private subscribeToStartStopEvents() {
    this.startEventSubscription.subscribe(async (state) => {
      if (!state) return

      if (state === 'START') {
        this.logfileService.log(
          'Background Geolocation',
          LogEventScope.tracking,
          LogEventType.start
        )
        try {
          await this.dbService.upsertTrajectory(
            new Trajectory({
              id: Trajectory.trackingTrajectoryID,
              type: TrajectoryType.USERTRACK,
              placename: 'Your Trajectory',
            })
          )
        } catch (err) {
          console.error(err)
        }
        this.trackingRunning.next(true)
        this.nextLocationIsStart = true
        this.sendNotification(
          this.translateService.instant('notification.locationUpdateTitle'),
          this.translateService.instant('notification.trackingStarted')
        )
      }

      if (state === 'STOP') {
        this.trackingRunning.next(false)
        this.logfileService.log(
          'Background Geolocation',
          LogEventScope.tracking,
          LogEventType.stop
        )
        this.nextLocationIsStart = false
        this.sendNotification(
          this.translateService.instant('notification.locationUpdateTitle'),
          this.translateService.instant('notification.trackingStopped')
        )
      }
    })
  }

  private sendNotification(title: string, text: string) {
    if (this.notificationsEnabled.value === false) return
    this.notificationService.notify(
      NotificationType.locationUpdate,
      title,
      text
    )
  }

  private async showGrantPermissionAlert() {
    await this.showAppSettingsAlert(
      this.translateService.instant('confirm.grantLocationPermissionSettings')
    )
  }

  private async showEnableLocationsAlert() {
    await this.showAppSettingsAlert(
      this.translateService.instant('confirm.showLocationServiceSettings')
    )
  }

  private async showAppSettingsAlert(message: string) {
    const alert = await this.alertController.create({
      message,
      buttons: [
        {
          text: this.translateService.instant('confirm.appSettingsButtonText'),
          cssClass: 'primary',
          handler: () => {
            this.backgroundGeolocation.openSettings()
          },
        },
        {
          text: this.translateService.instant('general.cancel'),
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            alert.dismiss()
          },
        },
      ],
    })

    await alert.present()
  }
}
