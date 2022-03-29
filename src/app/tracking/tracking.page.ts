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
import {
  InformedConsent,
  FirstTimeConsent,
} from '../shared-services/informed-consent/default'

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
  consented: boolean
  firstTime: boolean

  consent: boolean
  informedConsent: InformedConsent
  firstTimeConsent: FirstTimeConsent

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
    if (this.state === 'Running' && !this.consented) {
      this.alertController
        .create({
          header: this.translateService.instant('tracking.areYousSure'),
          message: this.translateService.instant('tracking.removeAgreeText'),
          buttons: [
            {
              text: 'cancel',
              handler: () => {
                this.consented = true
              },
            },
            {
              text: 'yes',
              handler: () => {
                this.setInformedConsent(this.consented)
                this.toggleBackgroundGeoLocation()
              },
            },
          ],
        })
        .then((res) => {
          res.present()
        })
    } else {
      this.setInformedConsent(this.consented)
    }
  }

  async presentAlertConfirm() {
    console.log(this.state)
    if (this.firstTime) {
      this.alertController
        .create({
          header: this.translateService.instant('tracking.consent'),
          message: this.translateService.instant('tracking.agreementQuestion'),
          buttons: [
            {
              text: 'no',
              handler: () => {
                this.consented = false
              },
            },
            {
              text: 'yes',
              handler: () => {
                this.consented = true
                this.toggleBackgroundGeoLocation()
              },
            },
          ],
        })
        .then((res) => {
          res.present()
        })
      this.setFirstTime()
    }
    this.toggleBackgroundGeoLocation()
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
    this.informedConsentService.getInformedConsent('consent').subscribe(
      (informedConsent) => (this.informedConsent = informedConsent),
      () => null,
      () => {
        this.consented = this.informedConsent.defaultInformedConsent
      }
    )
    this.informedConsentService.getFirstTimeConsent('firstTime').subscribe(
      (firstTimeConsent) => (this.firstTimeConsent = firstTimeConsent),
      () => null,
      () => {
        this.firstTime = this.firstTimeConsent.defaultFirstTimeConsent
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
    console.log('This opens inprint page.')
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

  setFirstTime() {
    this.firstTime = false
    this.firstTimeConsent.defaultFirstTimeConsent = this.firstTime
    this.informedConsentService.saveFirstTimeConsent(
      'firstTime',
      this.firstTimeConsent
    )
  }

  setInformedConsent(consented: boolean) {
    this.informedConsent.defaultInformedConsent = consented
    this.informedConsentService.saveInformedConsent(
      'consent',
      this.informedConsent
    )
  }
}
