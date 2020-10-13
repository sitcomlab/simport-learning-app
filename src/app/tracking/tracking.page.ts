import { Component, Input, NgZone, OnInit } from '@angular/core'
import { LocationService } from './location.service'

@Component({
  selector: 'app-tracking',
  templateUrl: './tracking.page.html',
  styleUrls: ['./tracking.page.scss'],
})
export class TrackingPage implements OnInit {
  @Input() state: string

  constructor(private zone: NgZone, private locationService: LocationService) {}

  ngOnInit() {
    this.setState('Waiting...')
    this.locationService.isRunning.subscribe((state) => {
      this.setState(state ? 'Running' : 'Stopped')
    })
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
