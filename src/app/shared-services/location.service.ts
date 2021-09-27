import { Injectable, OnDestroy } from '@angular/core'
import {
  BackgroundGeolocation,
  BackgroundGeolocationAuthorizationStatus,
  BackgroundGeolocationConfig,
  BackgroundGeolocationEvents,
} from '@ionic-native/background-geolocation/ngx'
import { Platform } from '@ionic/angular'
import { BehaviorSubject, Subscription } from 'rxjs'
import { PointState, Trajectory, TrajectoryType } from '../model/trajectory'
import { SqliteService } from './db/sqlite.service'
import { InferenceService } from './inferences/inference.service'
import { NotificationService } from './notification/notification.service'
import { NotificationType } from './notification/types'

@Injectable()
export class LocationService implements OnDestroy {
  private config: BackgroundGeolocationConfig = {
    desiredAccuracy: 10,
    stationaryRadius: 20,
    distanceFilter: 30,
    interval: 20000,
    debug: false, // NOTE: Disabled because of https://github.com/mauron85/cordova-plugin-background-geolocation/pull/633
    stopOnTerminate: false, // enable this to clear background location settings when the app terminates
    startForeground: true, // higher priority for location service, decreasing probability of OS killing it (Android)
  }
  private locationUpdateSubscription: Subscription
  private startEventSubscription: Subscription
  private stopEventSubscription: Subscription
  private logCounter = 0
  private nextLocationIsStart = false

  isRunning: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  notificationsEnabled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    true
  )

  constructor(
    private platform: Platform,
    private backgroundGeolocation: BackgroundGeolocation,
    private dbService: SqliteService,
    private inferenceService: InferenceService,
    private notificationService: NotificationService
  ) {
    if (!this.isSupportedPlatform) return

    this.logMessage('constructor called', '!!!')

    this.backgroundGeolocation.configure(this.config).then(() => {
      this.backgroundGeolocation.checkStatus().then(({ isRunning }) => {
        this.logMessage('check status', String(isRunning))
        if (isRunning) this.nextLocationIsStart = true
        this.isRunning.next(isRunning)
      })
      this.logMessage('configure plugin', 'resolved')
      this.subscribeToLocationUpdates()
      this.subscribeToStartStopEvents()
    })
  }

  ngOnDestroy() {
    this.logMessage('stop', ' on destroy')
    this.locationUpdateSubscription.unsubscribe()
    this.startEventSubscription.unsubscribe()
    this.stopEventSubscription.unsubscribe()
  }

  enableNotifications(enabled: boolean) {
    this.notificationsEnabled.next(enabled)
  }

  start() {
    if (!this.isSupportedPlatform) return

    this.backgroundGeolocation.checkStatus().then((status) => {
      if (status.isRunning) {
        this.stop()
        return false
      }
      if (!status.locationServicesEnabled) {
        const showSettings = confirm(
          'Location services disabled. Would you like to open app settings?'
        )
        if (showSettings) {
          return this.backgroundGeolocation.showAppSettings()
        } else return false
      }
      if (
        status.authorization === 99 ||
        BackgroundGeolocationAuthorizationStatus.AUTHORIZED
      ) {
        this.backgroundGeolocation.start()
        this.nextLocationIsStart = true
      } else {
        const showSettings = confirm(
          'App requires always on location permission. Please grant permission in settings.'
        )
        if (showSettings) {
          return this.backgroundGeolocation.showAppSettings()
        } else return false
      }
    })
  }

  stop() {
    if (!this.isSupportedPlatform) return

    this.backgroundGeolocation.checkStatus().then((status) => {
      if (status.isRunning) {
        this.backgroundGeolocation.stop()
        this.nextLocationIsStart = false
      }
    })
  }

  get isSupportedPlatform(): boolean {
    return this.platform.is('ios') || this.platform.is('android')
  }

  private subscribeToLocationUpdates() {
    this.locationUpdateSubscription = this.backgroundGeolocation
      .on(BackgroundGeolocationEvents.location)
      .subscribe(async ({ latitude, longitude, accuracy, speed, time }) => {
        const state = this.nextLocationIsStart ? PointState.START : null
        await this.dbService.upsertPoint(Trajectory.trackingTrajectoryID, {
          latLng: [latitude, longitude],
          time: new Date(time),
          accuracy,
          speed,
          state,
        })
        this.nextLocationIsStart = false

        if (this.inferenceService.isWithinInferenceSchedule()) {
          this.backgroundGeolocation.startTask().then(async (taskId) => {
            await this.inferenceService.generateUserInference().finally(() => {
              this.backgroundGeolocation.endTask(taskId)
            })
          })
        }

        this.logMessage(
          'Location Update',
          `${latitude.toFixed(4)} / ${longitude.toFixed(4)} (${accuracy.toFixed(
            1
          )}m)`
        )
        this.backgroundGeolocation.finish()
      })
  }

  private subscribeToStartStopEvents() {
    this.startEventSubscription = this.backgroundGeolocation
      .on(BackgroundGeolocationEvents.start)
      .subscribe(async () => {
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

        this.isRunning.next(true)
        this.nextLocationIsStart = true
        this.logMessage('Location Update', 'Tracking started')
      })

    this.stopEventSubscription = this.backgroundGeolocation
      .on(BackgroundGeolocationEvents.stop)
      .subscribe(() => {
        this.isRunning.next(false)
        this.nextLocationIsStart = false
        this.logMessage('Location Update', 'Tracking stopped')
      })
  }

  private scheduleNotification(title: string, text: string) {
    if (this.notificationsEnabled.value === false) return
    this.notificationService.notify(
      NotificationType.locationUpdate,
      title,
      text
    )
  }

  private logMessage(msg1: string, msg2: string) {
    console.log('### ' + msg1 + ' ' + msg2 + ' ' + this.logCounter)
    this.scheduleNotification(msg1, msg2 + ' ' + this.logCounter)
    this.logCounter++
  }
}
