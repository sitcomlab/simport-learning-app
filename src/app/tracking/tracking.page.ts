import { Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { ModalController, Platform } from '@ionic/angular'
import { Device } from '@ionic-native/device'
import { BehaviorSubject, Subscription } from 'rxjs'
import { Trajectory, TrajectoryType } from '../model/trajectory'
import { LocationService } from '../shared-services/location/location.service'
import { TrajectoryService } from '../shared-services/trajectory/trajectory.service'
import { TranslateService } from '@ngx-translate/core'
import { PausetimeSelectorComponent } from './pausetime-selector/pausetime-selector.component'
import { AlertController } from '@ionic/angular'
import { SettingsService } from '../shared-services/settings/settings.service'
import { FeatureFlagService } from '../shared-services/feature-flag/feature-flag.service'
import { SettingsConfig } from '../shared-services/settings/settings.fixtures'
import { LogfileService } from '../shared-services/logfile/logfile.service'
import { LogEventScope, LogEventType } from '../shared-services/logfile/types'

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
  hasInformedConsent: BehaviorSubject<boolean> = new BehaviorSubject(
    this.settingsService.getValue(SettingsConfig.hasConsent)
  )

  private locationServiceStateSubscription: Subscription
  private locationServiceNotificationToggleSubscription: Subscription
  private trajectoryServiceSubscription: Subscription

  constructor(
    public platform: Platform,
    public alertController: AlertController,
    public locationService: LocationService,
    public featureFlagService: FeatureFlagService,
    private zone: NgZone,
    private router: Router,
    private trajectoryService: TrajectoryService,
    private translateService: TranslateService,
    private modalController: ModalController,
    private settingsService: SettingsService,
    private logfileService: LogfileService
  ) {
    this.hasInformedConsent.subscribe((newConsent) => {
      this.settingsService.saveValue(SettingsConfig.hasConsent, newConsent)
      if (
        this.state === this.translateService.instant('tracking.stateRunning') &&
        !newConsent
      ) {
        this.alertController
          .create({
            header: this.translateService.instant(
              'tracking.removeConsentConfirmation'
            ),
            message: this.translateService.instant(
              'tracking.removeConsentConfirmationText'
            ),
            buttons: [
              {
                text: this.translateService.instant('general.cancel'),
                handler: () => {
                  this.hasInformedConsent.next(true)
                },
              },
              {
                text: this.translateService.instant('general.yes'),
                handler: () => {
                  this.locationService.stop()
                },
              },
            ],
          })
          .then((res) => {
            res.present()
          })
      }
    })
  }

  async presentAlertConfirm() {
    // if tracking is already running, we give option to turn off irrespective of content
    if (this.state === this.translateService.instant('tracking.stateRunning')) {
      this.toggleBackgroundGeoLocation()
      return
    }

    if (this.settingsService.getValue(SettingsConfig.isFirstConsent)) {
      this.alertController
        .create({
          header: this.translateService.instant(
            'tracking.informedConsentTitle'
          ),
          message: this.translateService.instant(
            'tracking.informedConsentText'
          ),
          buttons: [
            {
              text: this.translateService.instant('general.cancel'),
              role: 'cancel',
              cssClass: 'secondary',
              handler: () => {
                this.hasInformedConsent.next(false)
              },
            },
            {
              text: 'Okay',
              handler: () => {
                this.hasInformedConsent.next(true)
                this.settingsService.saveValue(
                  SettingsConfig.isFirstConsent,
                  false
                )
                this.toggleBackgroundGeoLocation()
              },
            },
          ],
        })
        .then((res) => {
          res.present()
        })
    } else {
      this.toggleBackgroundGeoLocation()
    }
  }

  ngOnInit() {
    this.updateTrackingButtonUI(false)
    this.locationServiceStateSubscription =
      this.locationService.trackingRunning.subscribe((trackingRunning) => {
        this.updateTrackingButtonUI(trackingRunning)
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

  updateTrackingButtonUI(trackingRunning: boolean) {
    this.zone.run(() => {
      switch (trackingRunning) {
        case true:
          this.state = this.translateService.instant('tracking.stateRunning')
          this.stateIcon = 'stop-circle'
          this.startStopButtonLabel =
            this.translateService.instant('tracking.toggleOff')
          break
        case false:
          this.state = this.translateService.instant('tracking.stateStopped')
          this.stateIcon = 'play-circle'
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
    this.logfileService.log(
      'View trajectory',
      LogEventScope.tracking,
      LogEventType.click
    )
    const type = TrajectoryType.USERTRACK
    const id = Trajectory.trackingTrajectoryID
    this.router.navigate([`/trajectory/${type}/${id}`])
  }

  openLocationSettings() {
    this.locationService.openLocationSettings()
  }

  openTerms() {
    this.logfileService.log(
      'View privacy policy',
      LogEventScope.tracking,
      LogEventType.click
    )
    this.router.navigate(['/settings/privacy-policy'])
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
