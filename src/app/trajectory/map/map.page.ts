import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import {
  IonRouterOutlet,
  LoadingController,
  ModalController,
  ToastController,
} from '@ionic/angular'
import {
  CircleMarker,
  DivIcon,
  FeatureGroup,
  latLng,
  LatLngBounds,
  LayerGroup,
  Map,
  MapOptions,
  Marker,
  Polygon,
  Polyline,
  tileLayer,
} from 'leaflet'
import { Subscription } from 'rxjs'
import { PointState, TrajectoryType } from 'src/app/model/trajectory'
import {
  Inference,
  InferenceConfidenceThresholds,
} from 'src/app/model/inference'
import {
  InferenceResultStatus,
  InferenceType,
} from 'src/app/shared-services/inferences/engine/types'
import { TrajectoryService } from 'src/app/shared-services/trajectory/trajectory.service'
import {
  InferenceService,
  InferenceServiceEvent,
} from 'src/app/shared-services/inferences/inference.service'
import haversine from 'haversine-distance'
import { FeatureFlagService } from 'src/app/shared-services/feature-flag/feature-flag.service'
import { TimetableService } from 'src/app/shared-services/timetable/timetable.service'
import { DiaryEditComponent } from 'src/app/diary/diary-edit/diary-edit.component'

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
      tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ),
    ],
  }
  mapBounds: LatLngBounds
  inferenceHulls = new LayerGroup()
  polylines = new FeatureGroup()
  lastLocation: CircleMarker
  followPosition: boolean
  suppressNextMapMoveEvent: boolean
  trajectoryType: TrajectoryType
  readonly disThreshold = 30000

  isInferencesEnabled =
    this.featureFlagService.featureFlags.isTrajectoryInferencesEnabled
  isPredictionsEnabled =
    this.featureFlagService.featureFlags.isTimetablePredicitionEnabled
  inferences: Inference[] = []
  generatedInferences = false
  predictedInferenceIds: string[] = []

  // should only be used for invalidateSize(), content changes via directive bindings!
  private map: Map | undefined
  private trajSubscription: Subscription
  private trajectoryId: string
  private inferenceFilterSubscription: Subscription

  constructor(
    private inferenceService: InferenceService,
    private trajectoryService: TrajectoryService,
    private featureFlagService: FeatureFlagService,
    private route: ActivatedRoute,
    private changeDetector: ChangeDetectorRef,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private timetableService: TimetableService,
    private modalController: ModalController,
    private routerOutlet: IonRouterOutlet
  ) {}

  async ngOnInit() {
    this.trajectoryId = this.route.snapshot.paramMap.get('trajectoryId')
    this.trajectoryType = this.route.snapshot.paramMap.get(
      'trajectoryType'
    ) as TrajectoryType

    this.trajSubscription = this.trajectoryService
      .getOne(this.trajectoryType, this.trajectoryId)
      .subscribe((t) => {
        const length = t.coordinates.length
        let distance = 0

        let temporaryCoordinates = []

        this.map.removeLayer(this.polylines)
        this.polylines.clearLayers()

        for (let i = 0; i < length; i++) {
          if (
            ((t.state[i] === PointState.START ||
              distance > this.disThreshold) &&
              i > 0) ||
            i === length - 1
          ) {
            const polyline = new Polyline(temporaryCoordinates, {
              weight: 1,
            })
            polyline.addTo(this.polylines)
            this.polylines.addTo(this.map)
            temporaryCoordinates = []
          }
          if (i + 1 < length) {
            distance = haversine(
              {
                latitude: t.coordinates[i][1],
                longitude: t.coordinates[i][0],
              },
              {
                latitude: t.coordinates[i + 1][1],
                longitude: t.coordinates[i + 1][0],
              }
            )
          }
          temporaryCoordinates.push(t.coordinates[i])
        }

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
          this.mapBounds = this.polylines.getBounds()
          this.map?.invalidateSize()
        }

        this.changeDetector.detectChanges()
      })

    await this.reloadInferences(true)

    this.inferenceFilterSubscription =
      this.inferenceService.inferenceServiceEvent.subscribe(async (event) => {
        if (
          event === InferenceServiceEvent.filterConfigurationChanged ||
          event === InferenceServiceEvent.inferencesUpdated
        ) {
          await this.reloadInferences()
        }
      })
  }

  ngOnDestroy() {
    if (this.trajSubscription) this.trajSubscription.unsubscribe()
    if (this.inferenceFilterSubscription)
      this.inferenceFilterSubscription.unsubscribe()
  }

  ionViewDidEnter() {
    // required after visibility of map changed.
    this.map?.invalidateSize()

    // TODO: rework this with optional inference type parameter,
    //   which we subscribe to and use to set zoom & open popup
    if (history.state.center) {
      this.mapBounds = latLng(history.state.center).toBounds(200)
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

  async reloadInferences(runGeocoding: boolean = false): Promise<void> {
    const inferenceResult = await this.inferenceService.loadPersistedInferences(
      this.trajectoryId,
      runGeocoding
    )
    this.inferences = inferenceResult.inferences
    this.updateInferenceMarkers()
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
        this.inferences = inferenceResult.inferences
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

  async predictNextVisit() {
    if (!this.generatedInferences) {
      await this.showLoadingDialog('Loading inferences...')
      const inferenceResult = await this.inferenceService
        .generateInferences(this.trajectoryType, this.trajectoryId)
        .finally(async () => {
          await this.hideLoadingDialog()
        })
      this.inferences = inferenceResult.inferences
    }
    const nextVisits = await this.timetableService.predictNextVisit(
      this.trajectoryId
    )
    if (nextVisits.length > 0) {
      this.predictedInferenceIds = nextVisits.map((v) => v.inference)
      this.updateInferenceMarkers()
      return await this.showToast(
        `We think that you will visit the highlighted ${
          nextVisits.length === 1 ? 'place' : 'places'
        } in the next hour`,
        'success'
      )
    } else {
      return await this.showErrorToast(
        `We couldn't make a prediction for the next hour`
      )
    }
  }

  updateInferenceMarkers() {
    this.inferenceHulls.clearLayers()
    for (const inference of this.inferences) {
      const h = new Polygon(inference.coordinates, {
        color: this.getIconColor(inference),
        weight: 2,
        opacity: inference.confidence || 0,
      })
      let popupText
      if (inference.type === InferenceType.poi) {
        popupText = `${inference.name}`
      } else {
        popupText = `${
          inference.name
        } (${InferenceConfidenceThresholds.getQualitativeConfidence(
          inference.confidence
        )})`
      }
      const isPredicted = this.predictedInferenceIds.includes(inference.id)
      const i = new Marker(inference.latLng, {
        icon: new DivIcon({
          className: `inference-icon ${inference.type} ${
            isPredicted ? 'predicted' : ''
          }`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          html: `<ion-icon class="inference-${inference.type}" name="${inference.icon}"></ion-icon>`,
        }),
      }).bindPopup(popupText)

      const l = new LayerGroup([h, i])

      l.addTo(this.inferenceHulls)
    }
  }

  openInferenceFilter() {
    this.inferenceService.triggerEvent(InferenceServiceEvent.configureFilter)
  }

  async openDiaryModal() {
    const modal = await this.modalController.create({
      component: DiaryEditComponent,
      swipeToClose: true,
      backdropDismiss: true,
      presentingElement: this.routerOutlet.nativeEl,
      componentProps: {
        isModal: true,
      },
    })
    modal.present()
  }

  private async showErrorToast(message: string) {
    await this.showToast(message, 'danger')
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      color,
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

  private getIconColor(inference: Inference) {
    switch (inference.type) {
      case InferenceType.home:
        return '#347d39'
      case InferenceType.work:
        return 'orange'
      case InferenceType.poi:
        return '#68347d'
    }
  }
}
