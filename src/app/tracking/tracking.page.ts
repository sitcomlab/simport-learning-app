import { Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core'
import { Platform } from '@ionic/angular'
import { Subscription } from 'rxjs'
import { LocationService } from '../shared-services/location.service'

@Component({
  selector: 'app-tracking',
  templateUrl: './tracking.page.html',
  styleUrls: ['./tracking.page.scss'],
})
export class TrackingPage implements OnInit, OnDestroy {
  @Input() state: string

  private locationServiceSubscription: Subscription

  constructor(
    private zone: NgZone,
    public platform: Platform,
    private locationService: LocationService
  ) {}

  ngOnInit() {
    this.setState('Waiting...')
    this.locationServiceSubscription = this.locationService.isRunning.subscribe(
      (state) => {
        this.setState(state ? 'Running' : 'Stopped')
      }
    )
  }

  ngOnDestroy() {
    this.locationServiceSubscription.unsubscribe()
  }

  toggleBackgroundGeoLocation() {
    this.locationService.start()
  }

  setState(state: string) {
    this.zone.run(() => {
      this.state = state
    })
  }
}
