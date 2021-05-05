import { Injectable, OnDestroy } from '@angular/core'
import {
  BackgroundGeolocation,
  BackgroundGeolocationAccuracy,
  BackgroundGeolocationAuthorizationStatus,
  BackgroundGeolocationConfig,
  BackgroundGeolocationEvents,
  BackgroundGeolocationLocationProvider,
} from '@ionic-native/background-geolocation/ngx'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'
import { Platform } from '@ionic/angular'
import { BehaviorSubject, Subscription } from 'rxjs'
import { Trajectory, TrajectoryType } from '../model/trajectory'
import { SqliteService } from './db/sqlite.service'

const TRACKING_TRAJ_ID = 'user'

@Injectable()
export class LocationService implements OnDestroy {
  private config: BackgroundGeolocationConfig = {
    locationProvider: BackgroundGeolocationLocationProvider.RAW_PROVIDER,
    desiredAccuracy: BackgroundGeolocationAccuracy.LOW,
    interval: 30000,
    stationaryRadius: 30,
    distanceFilter: 30,
    stopOnStillActivity: false,
    debug: false, // NOTE: Disabled because of https://github.com/mauron85/cordova-plugin-background-geolocation/pull/633
    stopOnTerminate: false, // enable this to clear background location settings when the app terminates
    startForeground: true, // higher priority for location service, decreasing probability of OS killing it (Android)
  }
  private locationUpdateSubscription: Subscription
  private startEventSubscription: Subscription
  private stopEventSubscription: Subscription

  isRunning: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  notificationsEnabled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  )

  constructor(
    private platform: Platform,
    private backgroundGeolocation: BackgroundGeolocation,
    private localNotifications: LocalNotifications,
    private db: SqliteService
  ) {
    if (!this.isSupportedPlatform) return

    this.backgroundGeolocation.configure(this.config).then(() => {
      this.subscribeToLocationUpdates()
      this.subscribeToStartStopEvents()
      this.backgroundGeolocation.checkStatus().then(({ isRunning }) => {
        this.isRunning.next(isRunning)
      })
    })
  }

  ngOnDestroy() {
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
      } else {
        const showSettings = confirm(
          'App requieres always on location permission. Please grant permission in settings.'
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
        await this.db.upsertPoint(TRACKING_TRAJ_ID, {
          latLng: [latitude, longitude],
          time: new Date(time),
          accuracy,
          speed,
        })

        this.scheduleNotification(
          `Received location update ${latitude} ${longitude} ${accuracy}`
        )
        this.backgroundGeolocation.finish()
      })
  }

  private subscribeToStartStopEvents() {
    this.startEventSubscription = this.backgroundGeolocation
      .on(BackgroundGeolocationEvents.start)
      .subscribe(async () => {
        try {
          await this.db.upsertTrajectory(
            new Trajectory({
              id: TRACKING_TRAJ_ID,
              type: TrajectoryType.USERTRACK,
              placename: 'Your Trajectory',
            })
          )
        } catch (err) {
          console.error(err)
        }

        this.isRunning.next(true)
        this.scheduleNotification('Background location started.')
      })

    this.stopEventSubscription = this.backgroundGeolocation
      .on(BackgroundGeolocationEvents.stop)
      .subscribe(() => {
        this.isRunning.next(false)
        this.scheduleNotification('Background location stopped.')
      })
  }

  private scheduleNotification(message: string) {
    if (this.notificationsEnabled.value === false) return
    this.localNotifications.schedule({
      id: Math.random() * 1000000,
      text: message,
      data: {},
    })
  }
}
