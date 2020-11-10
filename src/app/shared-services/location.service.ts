import { Injectable, OnDestroy } from '@angular/core'
import {
  BackgroundGeolocation,
  BackgroundGeolocationAuthorizationStatus,
  BackgroundGeolocationConfig,
  BackgroundGeolocationEvents,
} from '@ionic-native/background-geolocation/ngx'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'
import { Platform } from '@ionic/angular'
import { BehaviorSubject, Subscription } from 'rxjs'
import { Trajectory, TrajectoryType } from '../model/trajectory'
import { TrajectoryService } from './trajectory.service'

const TRACKING_TRAJ_ID = 'user'

@Injectable()
export class LocationService implements OnDestroy {
  private config: BackgroundGeolocationConfig = {
    desiredAccuracy: 10,
    stationaryRadius: 20,
    distanceFilter: 30,
    debug: false, // NOTE: Disabled because of https://github.com/mauron85/cordova-plugin-background-geolocation/pull/633
    stopOnTerminate: false, // enable this to clear background location settings when the app terminates
  }
  private locationUpdateSubscription: Subscription
  private startEventSubscription: Subscription
  private stopEventSubscription: Subscription

  isRunning: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  constructor(
    private platform: Platform,
    private backgroundGeolocation: BackgroundGeolocation,
    private localNotifications: LocalNotifications,
    private trajectories: TrajectoryService
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

  start() {
    if (!this.isSupportedPlatform) return

    this.backgroundGeolocation.checkStatus().then((status) => {
      if (status.isRunning) {
        this.backgroundGeolocation.stop()
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

  get isSupportedPlatform(): boolean {
    return this.platform.is('ios') || this.platform.is('android')
  }

  private subscribeToLocationUpdates() {
    this.locationUpdateSubscription = this.backgroundGeolocation
      .on(BackgroundGeolocationEvents.location)
      .subscribe(async ({ latitude, longitude, accuracy }) => {
        await this.trajectories.upsertPoint(TRACKING_TRAJ_ID, {
          latLng: [latitude, longitude],
          time: new Date(),
          accuracy,
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
          await this.trajectories.upsertTrajectory(
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
    this.localNotifications.schedule({
      id: Math.random() * 1000000,
      text: message,
      data: {},
    })
  }
}
