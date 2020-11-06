import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Circle, latLng, Map, MapOptions, Polyline, tileLayer } from 'leaflet'
import { Trajectory, TrajectoryType } from 'src/app/model/trajectory'
import { TrajectoryService } from 'src/app/shared-services/trajectory.service'
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
  polyline: Polyline

  constructor(
    private service: InferenceService,
    private route: ActivatedRoute,
    private trajectoryService: TrajectoryService
  ) {}

  ngOnInit() {
    this.initMapOptions()

    const trajectoryId = this.route.snapshot.paramMap.get('trajectoryId')
    const trajectoryType = this.route.snapshot.paramMap.get('trajectoryType') as TrajectoryType

    this.inferences = this.service.getInferences(trajectoryId)
    this.trajectoryService.getOne(trajectoryType, trajectoryId)
      .subscribe(t => {
        this.addTrajectory(t)
      })
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

  private async addTrajectory({ coordinates }: Trajectory) {
    if (this.polyline) this.polyline.removeFrom(this.map)
    this.polyline = new Polyline(coordinates).addTo(this.map)
  }
}
