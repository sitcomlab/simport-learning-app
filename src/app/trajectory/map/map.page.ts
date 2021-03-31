import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import {
  Circle,
  CircleMarker,
  latLng,
  LatLngBounds,
  LayerGroup,
  Map,
  MapOptions,
  Polyline,
  tileLayer,
} from 'leaflet'
import { Subscription } from 'rxjs'
import { Inference } from 'src/app/model/inference'
import { TrajectoryType } from 'src/app/model/trajectory'
import { TrajectoryService } from 'src/app/shared-services/trajectory.service'
import { InferenceService } from '../inferences/inference.service'

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
})
export class MapPage implements OnInit, OnDestroy {
  mapOptions: MapOptions = {
    center: [51.9694, 7.5954],
    zoom: 14,
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }),
    ],
  }
  mapBounds: LatLngBounds
  polyline: Polyline
  inferenceMarkers = new LayerGroup()
  lastLocation: CircleMarker

  // should only be used for invalidateSize(), content changes via directive bindings!
  private map: Map | undefined
  private trajSub: Subscription

  constructor(
    private inferences: InferenceService,
    private trajectories: TrajectoryService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const trajectoryId = this.route.snapshot.paramMap.get('trajectoryId')
    const trajectoryType = this.route.snapshot.paramMap.get(
      'trajectoryType'
    ) as TrajectoryType

    this.trajSub = this.trajectories
      .getOne(trajectoryType, trajectoryId)
      .subscribe((t) => {
        this.polyline = new Polyline(t.coordinates)

        const lastMeasurement = {
          location: t.coordinates[t.coordinates.length - 1],
          timestamp: t.timestamps[t.timestamps.length - 1],
        }

        this.lastLocation = new CircleMarker(lastMeasurement.location, {
          color: 'white',
          fillColor: '#428cff', // ionic primary blue
          fillOpacity: 1,
        }).bindPopup(`Timestamp: ${lastMeasurement.timestamp.toLocaleString()}`)
        this.mapBounds = this.polyline.getBounds()
        this.map?.invalidateSize()
      })

    this.addInferenceMarkers(this.inferences.getInferences(trajectoryId))
  }

  ngOnDestroy() {
    this.trajSub.unsubscribe()
  }

  ionViewDidEnter() {
    // required after visibility of map changed.
    this.map?.invalidateSize()

    // TODO: rework this with optional inference type parameter,
    //   which we subscribe to and use to set zoom & open popup
    if (history.state.center)
      this.mapBounds = latLng(history.state.center).toBounds(100)
  }

  onMapReady(map: Map) {
    this.map = map
  }

  private addInferenceMarkers(inferences: Inference[]) {
    this.inferenceMarkers.clearLayers()
    for (const inference of inferences) {
      if (!inference.lonLat || !inference.accuracy) continue
      const m = new Circle(inference.lonLat, {
        radius: inference.accuracy,
      })
      m.addTo(this.inferenceMarkers).bindPopup(inference.name)
    }
  }
}
