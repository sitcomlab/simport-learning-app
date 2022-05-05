import { Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { Platform } from '@ionic/angular'
import { Device } from '@ionic-native/device'
import { Subscription } from 'rxjs'
import { Trajectory, TrajectoryType } from '../model/trajectory'
import { LocationService } from '../shared-services/location/location.service'
import { TrajectoryService } from '../shared-services/trajectory/trajectory.service'
import { TranslateService } from '@ngx-translate/core'
import { AlertController } from '@ionic/angular'
import { InformedConsentService } from '../shared-services/informed-consent/informed-consent.service'
import { InformedConsentDefaults } from '../shared-services/informed-consent/informed-constent.fixtures'
import { InformedConsent } from './informed-consent'

@Component({
  selector: 'app-tracking',
  templateUrl: './tracking.page.html',
  styleUrls: ['./tracking.page.scss'],
})
export class TrackingPage implements OnInit, OnDestroy {
  @Input() state: string
  @Input() stateIcon: string
  @Input() notificationsEnabled: boolean
  trajectoryExists: boolean
  informedConsent: InformedConsent
  informedConsentDefaults: InformedConsentDefaults

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
    public alertController: AlertController,
    private informedConsentService: InformedConsentService
  ) {}

  async checkBox(): Promise<void> {
    if (this.state === 'Running' && !this.informedConsent.hasInformedConsent) {
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
                this.informedConsent.hasInformedConsent = true
              },
            },
            {
              text: this.translateService.instant('general.yes'),
              handler: () => {
                this.informedConsent.hasFirstTimeConsent = true
                this.setInformedConsent(this.informedConsent)
                this.toggleBackgroundGeoLocation()
              },
            },
          ],
        })
        .then((res) => {
          res.present()
        })
    } else {
      this.setInformedConsent(this.informedConsent)
    }
  }

  async presentAlertConfirm() {
    if (this.informedConsent.hasFirstTimeConsent) {
      this.alertController
        .create({
          header: this.translateService.instant('tracking.consent'),
          message: this.translateService.instant('tracking.agreementQuestion'),
          buttons: [
            {
              text: this.translateService.instant('general.no'),
              handler: () => {
                this.informedConsent.hasInformedConsent = false
              },
            },
            {
              text: this.translateService.instant('general.yes'),
              handler: () => {
                this.informedConsent.hasInformedConsent = true
                this.informedConsent.hasFirstTimeConsent = false
                this.toggleBackgroundGeoLocation()
              },
            },
          ],
        })
        .then((res) => {
          res.present()
        })
      this.setInformedConsent(this.informedConsent)
    } else {
      this.toggleBackgroundGeoLocation()
    }
  }

  ngOnInit() {
    this.setState(this.translateService.instant('tracking.loading'))
    this.setStateIcon(false)
    this.locationServiceStateSubscription =
      this.locationService.isRunning.subscribe((state) => {
        this.setState(
          state
            ? this.translateService.instant('tracking.stateRunning')
            : this.translateService.instant('tracking.stateStopped')
        )
        this.setStateIcon(state)
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
    this.informedConsentService.getInformedConsent().subscribe(
      (informedConsent) => (this.informedConsentDefaults = informedConsent),
      () => null,
      () => {
        this.informedConsent = new InformedConsent()
        this.informedConsent.hasInformedConsent =
          this.informedConsentDefaults.defaultInformedConsent
        this.informedConsent.hasFirstTimeConsent =
          this.informedConsentDefaults.defaultFirstTimeConsent
      }
    )
  }

  ngOnDestroy() {
    this.locationServiceStateSubscription.unsubscribe()
    this.locationServiceNotificationToggleSubscription.unsubscribe()
    this.trajectoryServiceSubscription.unsubscribe()
  }

  toggleBackgroundGeoLocation() {
    this.locationService.start()
  }

  setState(state: string) {
    this.zone.run(() => {
      this.state = state
    })
  }

  setStateIcon(running: boolean) {
    this.zone.run(() => {
      this.stateIcon = running ? 'stop-circle' : 'play-circle'
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

  openTerms() {
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

  setInformedConsent(consented: InformedConsent) {
    this.informedConsentDefaults.defaultInformedConsent =
      consented.hasInformedConsent
    this.informedConsentDefaults.defaultFirstTimeConsent =
      consented.hasFirstTimeConsent
    this.informedConsentService.saveInformedConsent(
      'consent',
      this.informedConsentDefaults
    )
  }
}
