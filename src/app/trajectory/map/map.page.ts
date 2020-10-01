import { Component, OnInit } from '@angular/core'
import * as L from 'leaflet'

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
})
export class MapPage implements OnInit {
  private map

  constructor() {}

  ngOnInit() {}

  ionViewDidEnter() {
    this.initMap()
  }

  ionViewDidLeave() {
    this.map.remove()
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [51.9694, 7.5954],
      zoom: 3,
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
}
