import { Component, OnInit } from '@angular/core'
import * as L from 'leaflet'
import { InferenceService } from '../inferences/inference.service'

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
})
export class MapPage implements OnInit {
  private map
  inferences: Inference[]

  constructor(private service: InferenceService) {}

  ngOnInit() {
    this.inferences = this.service.getInferences()
  }

  ionViewDidEnter() {
    this.initMap()
    this.addInferenceMarkers()
  }

  ionViewDidLeave() {
    this.map.remove()
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [51.9694, 7.5954],
      zoom: 14,
    })

    const tiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    )

    tiles.addTo(this.map)
  }

  private addInferenceMarkers(): void {
    for (let inference of this.inferences) {
      if (!inference.location || !inference.accuracy) break
      L.circle(inference.location, { radius: inference.accuracy })
        .addTo(this.map)
        .bindPopup(inference.name)
        .openPopup()
    }
  }
}
