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
import { AppSettingsService } from '../shared-services/appsettings.service'

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
    private appSettingsService: AppSettingsService
  ) {}

  async checkBox() {
    console.log('Consented new state:' + this.consented)
  }

  async presentAlertConfirm() {
    this.alertController
      .create({
        header: 'Consent',
        message:
          'Do you agree with the <a [routerLink]="" (click)="openTerms()">terms and privacy policy</a>?',
        buttons: [
          {
            text: 'No',
            handler: () => {
              console.log('No')
              this.consented = false
            },
          },
          {
            text: 'Yes',
            handler: () => {
              console.log('Yes')
              this.consented = true
              this.toggleBackgroundGeoLocation()
            },
          },
        ],
      })
      .then((res) => {
        res.present()
      })
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
    this.consented = this.appSettingsService.informedConsent
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
    this.router.navigate(['/settings/imprint'])
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
