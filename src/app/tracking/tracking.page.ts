import { Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { ModalController, Platform } from '@ionic/angular'
import { Device } from '@ionic-native/device'
import { Subscription } from 'rxjs'
import { Trajectory, TrajectoryType } from '../model/trajectory'
import { LocationService } from '../shared-services/location/location.service'
import { TrajectoryService } from '../shared-services/trajectory/trajectory.service'
import { TranslateService } from '@ngx-translate/core'
import { LocationTrackingStatus } from '../model/location-tracking'
import { PausetimeSelectorComponent } from './pausetime-selector/pausetime-selector.component'

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
    private modalController: ModalController
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

  async toggleBackgroundGeoLocation() {
    if (this.state === this.translateService.instant('tracking.stateRunning')) {
      await this.openPausetimeSelector()
    } else {
      this.locationService.start()
    }
  }

  scheduleUnpauseNotification(unpauseMinutes: number) {
    const unpauseDate = new Date()
    unpauseDate.setMinutes(unpauseDate.getMinutes() + unpauseMinutes)
    this.locationService.sendUnpauseNotificationAtTime(unpauseDate)
  }

  async openPausetimeSelector() {
    const modal = await this.modalController.create({
      component: PausetimeSelectorComponent,
      swipeToClose: true,
      cssClass: 'auto-height',
    })
    modal.present()
    const { data: modalResponse } = await modal.onWillDismiss()
    if (modalResponse) {
      // make sure the user didnt dismiss modal by cancelling
      if (modalResponse.confirmStop) {
        this.locationService.start()
        const unpauseInMinutes = parseInt(
          modalResponse.selectedPauseMinutes,
          10
        )
        if (unpauseInMinutes !== 0) {
          this.scheduleUnpauseNotification(unpauseInMinutes)
        }
      }
    }
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
