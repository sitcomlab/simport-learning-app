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
  Layer,
  LayerGroup,
  Map,
  MapOptions,
  Marker,
  Polyline,
  tileLayer,
} from 'leaflet'
import { MarkerClusterGroup } from 'leaflet.markercluster'
import { Spline } from 'leaflet-spline'
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
import { TranslateService } from '@ngx-translate/core'
import { LogfileService } from '../../shared-services/logfile/logfile.service'
import {
  LogEventScope,
  LogEventType,
} from '../../shared-services/logfile/types'
import { ALL_INFERENCES } from 'src/app/shared-services/inferences/engine/definitions'

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
})
export class MapPage implements OnInit, OnDestroy {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  TrajectoryTypes: typeof TrajectoryType = TrajectoryType // for use in template
  mapOptions: MapOptions = {
    center: [0, 0],
    zoom: 1,
    layers: [
      tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          attribution: this.mapAttributionString,
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ),
    ],
  }
  mapBounds: LatLngBounds
  polylines: FeatureGroup
  inferenceHulls = new LayerGroup()
  lastLocation: CircleMarker
  followPosition: boolean
  suppressNextMapMoveEvent: boolean
  trajectoryType: TrajectoryType
  readonly disThreshold = 30000

  isInferencesEnabled =
    this.featureFlagService.featureFlags.isTrajectoryInferencesTabEnabled
  isPoiInferencesEnabled =
    this.featureFlagService.featureFlags.isPoiInferenceComputationEnabled
  isPredictionsEnabled =
    this.featureFlagService.featureFlags.isTimetableComputationEnabled
  inferences: Inference[] = []
  generatedInferences = false
  predictedInferenceIds: string[] = []

  // should only be used for invalidateSize(), content changes via directive bindings!
  private map: Map | undefined
  private trajSubscription: Subscription
  private trajectoryId: string
  private inferenceFilterSubscription: Subscription

  constructor(
    public featureFlagService: FeatureFlagService,
    private inferenceService: InferenceService,
    private trajectoryService: TrajectoryService,
    private route: ActivatedRoute,
    private changeDetector: ChangeDetectorRef,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private timetableService: TimetableService,
    private modalController: ModalController,
    private routerOutlet: IonRouterOutlet,
    private translateService: TranslateService,
    private logfileService: LogfileService
  ) {}

  private get mapAttributionString(): string {
    const osmContributors = this.translateService.instant(
      'trajectory.map.osmContributors'
    )
    // eslint-disable-next-line max-len
    return `&copy; <a href="https://www.openstreetmap.org/copyright">${osmContributors}</a> &copy; <a href="https://carto.com/attributions">CARTO</a>`
  }

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
        const segments = new LayerGroup()

        for (let i = 0; i <= length; i++) {
          if (
            ((t.state[i] === PointState.START ||
              distance > this.disThreshold) &&
              i > 0) ||
            i === length
          ) {
            const polyline = new Polyline(temporaryCoordinates, {
              weight: 1,
            })
            polyline.addTo(segments)
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
          if (i < length) temporaryCoordinates.push(t.coordinates[i])
        }

        this.polylines = new FeatureGroup(segments.getLayers())

        const lastMeasurement = {
          location: t.coordinates[t.coordinates.length - 1],
          timestamp: t.timestamps[t.timestamps.length - 1],
        }

        const locale = this.translateService.currentLang
        const popupString = this.translateService.instant(
          'trajectory.map.timestampPopup',
          { value: lastMeasurement.timestamp.toLocaleString(locale) }
        )
        this.lastLocation = new CircleMarker(lastMeasurement.location, {
          color: 'white',
          fillColor: '#428cff', // ionic primary blue
          fillOpacity: 1,
        }).bindPopup(popupString)

        if (this.followPosition) {
          this.suppressNextMapMoveEvent = true
          this.mapBounds = this.lastLocation.getLatLng().toBounds(100)
        } else if (this.mapBounds === undefined) {
          this.mapBounds = this.polylines.getBounds()
          this.map?.invalidateSize()
        }

        this.changeDetector.detectChanges()
      })

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
    this.logfileService.log(
      'Close trajectory',
      LogEventScope.other,
      LogEventType.click
    )
  }

  async ionViewDidEnter() {
    // required after visibility of map changed.
    this.map?.invalidateSize()

    // TODO: rework this with optional inference type parameter,
    //   which we subscribe to and use to set zoom & open popup
    if (history.state.center) {
      setTimeout(() => {
        this.map?.flyTo(latLng(history.state.center), 18, {
          easeLinearity: 0.1,
          duration: 3,
        })
      }, 500)
    }
    await this.reloadInferences(true)
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
    await this.showLoadingDialog(
      this.translateService.instant('trajectory.map.loadingInferences')
    )
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
          this.translateService.instant(
            'trajectory.map.error.tooManyCoordinates'
          )
        )
      case InferenceResultStatus.noInferencesFound:
        return await this.showErrorToast(
          this.translateService.instant(
            'trajectory.map.error.noInferencesFound'
          )
        )
      default:
        return await this.showErrorToast(
          this.translateService.instant('trajectory.map.error.default')
        )
    }
  }

  async predictNextVisit() {
    if (!this.generatedInferences) {
      await this.showLoadingDialog(
        this.translateService.instant('trajectory.map.loadingInferences')
      )
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
        this.translateService.instant(
          `trajectory.map.predictionSuccess.${
            nextVisits.length === 1 ? 'singular' : 'plural'
          }`
        ),
        'success'
      )
    } else {
      return await this.showErrorToast(
        this.translateService.instant('trajectory.map.predictionFail')
      )
    }
  }

  updateInferenceMarkers() {
    this.inferenceHulls.clearLayers()
    const clusterGroup = new MarkerClusterGroup({
      animateAddingMarkers: true,
      maxClusterRadius: 3,
      spiderLegPolylineOptions: {
        weight: 2,
        color: 'gray',
        opacity: 0.75,
      },
      iconCreateFunction: (cluster) =>
        new DivIcon({
          className: 'inference-map-cluster',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          html: '<b>' + cluster.getChildCount() + '</b>',
        }),
    })
    const layerGroup = this.createInferenceLayers()
    clusterGroup.addLayer(layerGroup)
    clusterGroup.addTo(this.inferenceHulls)
  }

  openInferenceFilter() {
    this.inferenceService.triggerEvent(InferenceServiceEvent.configureFilter)
  }

  async openDiaryModal() {
    this.logfileService.log(
      'Create diary-entry from trajectory',
      LogEventScope.other,
      LogEventType.click
    )
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

  private createInferenceLayers(): LayerGroup {
    // count how often each latLng appears within current inferences
    const latLngCount = {}
    this.inferences
      .map((i) => i.latLngHash)
      .forEach((key) => {
        latLngCount[key] = (latLngCount[key] || 0) + 1
      })
    const addedLatLngHashes = []
    const layers: Layer[] = []
    for (const inference of this.inferences) {
      // add polygon only, if not already there yet to prevent stacking identical polygons
      if (!addedLatLngHashes.includes(inference.latLngHash)) {
        addedLatLngHashes.push(inference.latLngHash)
        // color gray, if this polygon is ambiguous
        const isAmbiguousLatLng = latLngCount[inference.latLngHash] > 1
        const color = isAmbiguousLatLng
          ? 'gray'
          : ALL_INFERENCES[inference.type].color
        const spline = new Spline(inference.coordinates, {
          color,
          fill: true,
          fillColor: color,
          fillOpacity: 0.35,
          smoothing: 0.0,
          weight: 2,
        })
        layers.push(spline)
      }

      // add marker
      const inferenceName = this.translateService.instant(
        `inference.${inference.name}`
      )
      let popupText: string
      if (inference.type === InferenceType.poi) {
        popupText = inferenceName
      } else {
        const confidenceValue =
          InferenceConfidenceThresholds.getQualitativeConfidence(
            inference.confidence
          )
        const confidence = this.translateService.instant(
          `inference.confidence.${confidenceValue}`
        )
        popupText = `${inferenceName} (${confidence})`
      }
      const isPredicted = this.predictedInferenceIds.includes(inference.id)
      const marker = new Marker(inference.latLng, {
        icon: new DivIcon({
          className: `inference-icon ${inference.type} ${
            isPredicted ? 'predicted' : ''
          }`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          html: `<ion-icon class="inference-${inference.type}" name="${inference.icon}"></ion-icon>`,
        }),
      }).bindPopup(popupText)
      layers.push(marker)
    }
    return new LayerGroup(layers)
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
}
