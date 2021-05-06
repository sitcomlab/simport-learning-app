import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { LoadingController, ToastController } from '@ionic/angular'
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
import {
  InferenceResultStatus,
  InferenceType,
} from 'src/app/shared-services/inferences/types'
import { TrajectoryService } from 'src/app/shared-services/trajectory.service'
import { InferenceService } from 'src/app/shared-services/inferences/inference.service'

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
})
export class MapPage implements OnInit, OnDestroy {
  TrajectoryTypes: typeof TrajectoryType = TrajectoryType // for use in template
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
  followPosition: boolean
  suppressNextMapMoveEvent: boolean
  trajectoryType: TrajectoryType

  // inference controls
  showInferenceControls = false
  showHomeInferences = true
  showWorkInferences = true
  currentConfidenceThreshold = 50
  currentInferences: Inference[]
  generatedInferences = false

  // should only be used for invalidateSize(), content changes via directive bindings!
  private map: Map | undefined
  private trajSub: Subscription
  private trajectoryId: string

  constructor(
    private inferenceService: InferenceService,
    private trajectoryService: TrajectoryService,
    private route: ActivatedRoute,
    private changeDetector: ChangeDetectorRef,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    this.trajectoryId = this.route.snapshot.paramMap.get('trajectoryId')
    this.trajectoryType = this.route.snapshot.paramMap.get(
      'trajectoryType'
    ) as TrajectoryType

    this.trajSub = this.trajectoryService
      .getOne(this.trajectoryType, this.trajectoryId)
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

        if (this.followPosition) {
          this.suppressNextMapMoveEvent = true
          this.mapBounds = this.lastLocation.getLatLng().toBounds(100)
        } else if (this.mapBounds === undefined) {
          this.mapBounds = this.polyline.getBounds()
          this.map?.invalidateSize()
        }

        this.changeDetector.detectChanges()
      })

    this.currentInferences = this.inferenceService.loadPersistedInferences(
      this.trajectoryId
    ).inferences
    this.updateInferenceMarkers()
  }

  ngOnDestroy() {
    this.trajSub.unsubscribe()
  }

  ionViewDidEnter() {
    // required after visibility of map changed.
    this.map?.invalidateSize()

    // TODO: rework this with optional inference type parameter,
    //   which we subscribe to and use to set zoom & open popup
    if (history.state.center) {
      this.mapBounds = latLng(history.state.center).toBounds(100)
    }
  }

  onMapReady(map: Map) {
    this.map = map
  }

  onMapMoved(map: Map) {
    if (!this.suppressNextMapMoveEvent) {
      this.followPosition = false
    } else {
      this.suppressNextMapMoveEvent = false
    }
  }

  onToggleFollowMode() {
    this.suppressNextMapMoveEvent = true
    this.followPosition = !this.followPosition
    if (this.followPosition) {
      this.mapBounds = this.lastLocation.getLatLng().toBounds(100)
    }
  }

  onToggleInferenceControls() {
    this.showInferenceControls = !this.showInferenceControls
  }

  async showInferences() {
    await this.showLoadingDialog('Loading inferences...')
    const inferenceResult = await this.inferenceService
      .generateInferences(this.trajectoryType, this.trajectoryId)
      .finally(async () => {
        await this.hideLoadingDialog()
      })
    switch (inferenceResult.status) {
      case InferenceResultStatus.successful:
        this.generatedInferences = true
        this.currentInferences = inferenceResult.inferences
        return this.updateInferenceMarkers()
      case InferenceResultStatus.tooManyCoordinates:
        return await this.showErrorToast(
          `Trajectory couldn't be analyzed, because it has too many coordinates`
        )
      case InferenceResultStatus.noInferencesFound:
        return await this.showErrorToast(
          `No inferences were found within your trajectory`
        )
      default:
        return await this.showErrorToast(`Trajectory couldn't be analyzed`)
    }
  }

  updateInferenceMarkers() {
    const inferences = this.currentInferences.filter(
      (i) =>
        i.lonLat &&
        i.accuracy &&
        (i.confidence || 0) > this.currentConfidenceThreshold / 100.0 &&
        (this.showHomeInferences || i.type !== InferenceType.home) &&
        (this.showWorkInferences || i.type !== InferenceType.work)
    )
    this.inferenceMarkers.clearLayers()
    for (const inference of inferences) {
      const m = new Circle([inference.lonLat[1], inference.lonLat[0]], {
        radius: inference.accuracy,
        color: 'red',
      })
      m.addTo(this.inferenceMarkers).bindPopup(
        `${inference.name} (${Math.round((inference.confidence || 0) * 100)}%)`
      )
    }
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message,
      color: 'danger',
      duration: 2000,
    })
    await toast.present()
  }

  private async showLoadingDialog(message: string) {
    const loading = await this.loadingController.create({
      message,
      translucent: true,
    })
    await loading.present()
  }

  private async hideLoadingDialog() {
    await this.loadingController.dismiss()
  }
}
