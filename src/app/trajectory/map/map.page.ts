import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { latLng, MapOptions, tileLayer, Map, Circle, Polyline } from 'leaflet'
import { Subscription } from 'rxjs'
import { TrajectoryService } from 'src/app/shared-services/trajectory.service'
import { InferenceService } from '../inferences/inference.service'

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
})
export class MapPage implements OnInit, OnDestroy {
  mapOptions: MapOptions
  map: Map
  inferences: Inference[]
  trajectoryId: string

  private paramSub: Subscription

  constructor(
    private service: InferenceService,
    private route: ActivatedRoute,
    private trajectoryService: TrajectoryService
  ) {}

  ngOnInit() {
    this.initMapOptions()
    this.paramSub = this.route.paramMap.subscribe(p => {
      this.trajectoryId = p.get('trajectoryId')
      this.inferences = this.service.getInferences(this.trajectoryId)
    })
  }

  ngOnDestroy() {
    this.paramSub.unsubscribe()
  }

  ionViewDidEnter() {
    this.map.invalidateSize()
    this.addInferenceMarkers()
    this.addTrajectory()
  }

  onMapReady(map: Map) {
    this.map = map
  }

  private initMapOptions() {
    this.mapOptions = {
      center: latLng(51.9694, 7.5954),
      zoom: 14,
      layers: [
        tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution:
            '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }),
      ],
    }
  }

  private addInferenceMarkers() {
    for (let inference of this.inferences) {
      if (!inference.location || !inference.accuracy) break
      new Circle(inference.location, {
        radius: inference.accuracy,
      })
        .addTo(this.map)
        .bindPopup(inference.name)
        .openPopup()
    }
  }

  private addTrajectory() {
    let coordinates = this.trajectoryService.getTrajectory(this.trajectoryId)
      .coordinates
    new Polyline(coordinates).addTo(this.map)
  }
}
