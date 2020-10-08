import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { latLng, MapOptions, tileLayer, Map, Circle } from 'leaflet'
import { InferenceService } from '../inferences/inference.service'

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
})
export class MapPage implements OnInit {
  mapOptions: MapOptions
  map: Map
  inferences: Inference[]

  constructor(private service: InferenceService, private router: Router) {}

  ngOnInit() {
    this.initMapOptions()
    let trajectoryId = this.router.url.split('/')[2]
    this.inferences = this.service.getInferences(trajectoryId)
  }

  ionViewDidEnter() {
    this.map.invalidateSize()
    this.addInferenceMarkers()
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
}
