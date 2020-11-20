import { Component, Input, NgZone, OnDestroy, OnInit } from '@angular/core'
import { Platform } from '@ionic/angular'
import { LngLatLike } from 'mapbox-gl'
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

  // properties for the mapbox map
  geometry: any = {
    type: 'MultiPoint',
    coordinates: [
      // coordinates will be pushed here
    ],
  }
  // center of the map
  center: LngLatLike

  constructor(
    private zone: NgZone,
    public platform: Platform,
    private locationService: LocationService,
    private trajectoryService: TrajectoryService
  ) {}

  ngOnInit() {
    this.setState('Waiting...')
    this.locationServiceSubscription = this.locationService.isRunning.subscribe(
      (state) => {
        this.setState(state ? 'Running' : 'Stopped')
      }
    )

    // subscribing to data of current track
    this.trajectoryService
      .getOne(TrajectoryType.USERTRACK, 'user')
      .subscribe((trajecotry) => {
        if (trajecotry.coordinates.length > 0) {
          this.geometry.coordinates = trajecotry.coordinates
          this.center =
            trajecotry.coordinates[trajecotry.coordinates.length - 1]
        }
      })
  }

  ngOnDestroy() {
    this.locationServiceSubscription.unsubscribe()
  }

  onMapLoad(map) {
    map.resize()
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
