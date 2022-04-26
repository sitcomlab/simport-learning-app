import { Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { PickerController, PickerOptions, Platform } from '@ionic/angular'
import { Device } from '@ionic-native/device'
import { Subscription } from 'rxjs'
import { Trajectory, TrajectoryType } from '../model/trajectory'
import { LocationService } from '../shared-services/location/location.service'
import { TrajectoryService } from '../shared-services/trajectory/trajectory.service'
import { TranslateService } from '@ngx-translate/core'
import { LocationTrackingStatus } from '../model/location-tracking'

@Component({
  selector: 'app-tracking',
  templateUrl: './tracking.page.html',
  styleUrls: ['./tracking.page.scss'],
})
export class TrackingPage implements OnInit, OnDestroy {
  @Input() state: string
  @Input() stateIcon: string
  @Input() startStopButtonLabel: string
  @Input() notificationsEnabled: boolean
  trajectoryExists: boolean

  private locationServiceStateSubscription: Subscription
  private locationServiceNotificationToggleSubscription: Subscription
  private trajectoryServiceSubscription: Subscription

  constructor(
    private zone: NgZone,
    public platform: Platform,
    public locationService: LocationService,
    private trajectoryService: TrajectoryService,
    private router: Router,
    private translateService: TranslateService,
    private pickerController: PickerController
  ) {}

  ngOnInit() {
    this.updateTrackingButtonUI('isStopped')
    this.locationServiceStateSubscription =
      this.locationService.trackingStatusChange.subscribe((trackingState) => {
        this.updateTrackingButtonUI(trackingState)
      })

    this.locationServiceNotificationToggleSubscription =
      this.locationService.notificationsEnabled.subscribe((enabled) => {
        this.setNotificationToggle(enabled)
      })
    // check if user trajectory is existent
    this.trajectoryServiceSubscription = this.trajectoryService
      .getWritableMeta()
      .subscribe((tm) => {
        this.trajectoryExists =
          tm.find((t) => t.id === Trajectory.trackingTrajectoryID) !== undefined
      })
  }

  ngOnDestroy() {
    this.locationServiceStateSubscription.unsubscribe()
    this.locationServiceNotificationToggleSubscription.unsubscribe()
    this.trajectoryServiceSubscription.unsubscribe()
  }

  toggleBackgroundGeoLocation() {
    this.locationService.start()
  }

  async showPauseTimePicker() {
    const options: PickerOptions = {
      buttons: [
        {
          text: this.translateService.instant('general.cancel'),
          role: 'cancel',
        },
        {
          text: this.translateService.instant('tracking.confirmPause'),
          handler: (selected) => {
            this.pauseBackgroundGeoLocationFor(selected.pauseMinutes.value)
          },
        },
      ],
      columns: [
        {
          name: 'pauseMinutes',
          options: [
            {
              text: '30 ' + this.translateService.instant('tracking.minutes'),
              value: 30,
            },
            {
              text: '60 ' + this.translateService.instant('tracking.minutes'),
              value: 60,
            },
            {
              text: '90 ' + this.translateService.instant('tracking.minutes'),
              value: 90,
            },
            {
              text: '2 ' + this.translateService.instant('tracking.hours'),
              value: 120,
            },
            {
              text: '3 ' + this.translateService.instant('tracking.hours'),
              value: 180,
            },
            {
              text: '4 ' + this.translateService.instant('tracking.hours'),
              value: 240,
            },
          ],
        },
      ],
    }
    const picker = await this.pickerController.create(options)
    await picker.present()
  }

  pauseBackgroundGeoLocationFor(unpauseMinutes: number) {
    // TODO display unpause date in status
    const unpauseDate = new Date()
    unpauseDate.setMinutes(unpauseDate.getMinutes() + unpauseMinutes)
    this.locationService.pauseUntil(unpauseDate)
  }

  updateTrackingButtonUI(state: LocationTrackingStatus) {
    this.zone.run(() => {
      switch (state) {
        case 'isRunning':
          this.state = this.translateService.instant('tracking.stateRunning')
          this.stateIcon = 'play-circle'
          this.startStopButtonLabel =
            this.translateService.instant('tracking.toggleOff')
          break
        case 'isStopped':
          this.state = this.translateService.instant('tracking.stateStopped')
          this.stateIcon = 'stop-circle'
          this.startStopButtonLabel =
            this.translateService.instant('tracking.toggleOn')
          break
        case 'isPaused':
          // TODO add info when turns back on
          this.state = this.translateService.instant('tracking.statePaused')
          this.stateIcon = 'pause-circle'
          this.startStopButtonLabel =
            this.translateService.instant('tracking.toggleOn')
          break
      }
    })
  }

  setNotificationToggle(enabled: boolean) {
    this.zone.run(() => {
      this.notificationsEnabled = enabled
    })
  }

  notificationToggleChanged() {
    this.locationService.enableNotifications(this.notificationsEnabled)
  }

  navigateUserTrajectory() {
    const type = TrajectoryType.USERTRACK
    const id = Trajectory.trackingTrajectoryID
    this.router.navigate([`/trajectory/${type}/${id}`])
  }

  openLocationSettings() {
    this.locationService.openLocationSettings()
  }

  hasAlwaysAllowLocationOption(): boolean {
    if (this.platform.is('ios')) {
      // 'always-allow' exists in all iOS-versions supported by this app
      return true
    } else if (this.platform.is('android')) {
      const osVersion = parseInt(Device.version, 10) || 0
      // 'always-allow' exists since OS-version 10 = API-level 29
      return osVersion >= 10
    }
    return false
  }
}
