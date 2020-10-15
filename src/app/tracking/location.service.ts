import { Injectable, OnDestroy } from '@angular/core'
import {
  BackgroundGeolocation,
  BackgroundGeolocationAuthorizationStatus,
  BackgroundGeolocationConfig,
  BackgroundGeolocationEvents,
  BackgroundGeolocationResponse,
} from '@ionic-native/background-geolocation/ngx'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'
import { Platform } from '@ionic/angular'
import { BehaviorSubject, Subscription } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class LocationService implements OnDestroy {
  private config: BackgroundGeolocationConfig = {
    desiredAccuracy: 10,
    stationaryRadius: 20,
    distanceFilter: 30,
    debug: false, //  enable this hear sounds for background-geolocation life-cycle. NOTE: Disabled because of https://github.com/mauron85/cordova-plugin-background-geolocation/pull/633
    stopOnTerminate: false, // enable this to clear background location settings when the app terminates
  }
  private locationUpdateSubscription: Subscription
  private startEventSubscription: Subscription
  private stopEventSubscription: Subscription

  isRunning: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  constructor(
    private platform: Platform,
    private backgroundGeolocation: BackgroundGeolocation,
    private localNotifications: LocalNotifications
  ) {
    if (!this.isSupportedPlatform) return

    this.backgroundGeolocation.configure(this.config).then(() => {
      this.subscribeToLocationUpdates()
      this.subscribeToStartStopEvents()
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
        var showSettings = confirm(
          'Location services disabled. Would you like to open app settings?'
        )
        if (showSettings) {
          return this.backgroundGeolocation.showAppSettings()
        } else return false
      }
      if (
        status.authorization == 99 ||
        BackgroundGeolocationAuthorizationStatus.AUTHORIZED
      ) {
        this.backgroundGeolocation.start()
      } else {
        var showSettings = confirm(
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
      .subscribe((location: BackgroundGeolocationResponse) => {
        this.scheduleNotification(
          'Received location update ' +
            location.latitude +
            ' ' +
            location.longitude +
            ' ' +
            location.accuracy
        )
        this.backgroundGeolocation.finish()
      })
  }

  private subscribeToStartStopEvents() {
    this.startEventSubscription = this.backgroundGeolocation
      .on(BackgroundGeolocationEvents.start)
      .subscribe(() => {
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
