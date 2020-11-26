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

  private locationServiceSubscription: Subscription
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
    this.locationServiceSubscription = this.locationService.isRunning.subscribe(
      (state) => {
        this.setState(state ? 'Running' : 'Stopped')
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
    this.locationServiceSubscription.unsubscribe()
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

  navigateUserTrajectory() {
    const type = TrajectoryType.USERTRACK
    const id = 'user'
    this.router.navigate([`/trajectory/${type}/${id}`])
  }
}
