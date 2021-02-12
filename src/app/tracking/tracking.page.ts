import { Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { Platform } from '@ionic/angular'
import { Subscription } from 'rxjs'
import { TrajectoryType } from '../model/trajectory'
import { LocationService } from '../shared-services/location.service'
import { TrajectoryService } from '../shared-services/trajectory.service'

@Component({
  selector: 'app-tracking',
  templateUrl: './tracking.page.html',
  styleUrls: ['./tracking.page.scss'],
})
export class TrackingPage implements OnInit, OnDestroy {
  @Input() state: string
  @Input() stateIcon: string
  @Input() notificationsEnabled: boolean

  private locationServiceStateSubscription: Subscription
  private locationServiceNotificationToggleSubscription: Subscription
  private trajectoryServiceSubscription: Subscription

  private trajectoryExists: boolean

  constructor(
    private zone: NgZone,
    public platform: Platform,
    private locationService: LocationService,
    private trajectoryService: TrajectoryService,
    private router: Router
  ) {}

  ngOnInit() {
    this.setState('Waiting...')
    this.locationServiceStateSubscription = this.locationService.isRunning.subscribe(
      (state) => {
        this.setState(state ? 'Running' : 'Stopped')
        this.setStateIcon(state)
      }
    )
    this.locationServiceNotificationToggleSubscription = this.locationService.notificationsEnabled.subscribe(
      (enabled) => {
        this.setNotificationToggle(enabled)
      }
    )
    // check if user trajectory is existent
    this.trajectoryServiceSubscription = this.trajectoryService
      .getWritableMeta()
      .subscribe((tm) => {
        this.trajectoryExists = tm.find((t) => t.id === 'user') !== undefined
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
    const id = 'user'
    this.router.navigate([`/trajectory/${type}/${id}`])
  }
}
