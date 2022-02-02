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
import {
  Inference,
  InferenceConfidenceThresholds,
} from 'src/app/model/inference'
import { TrajectoryType } from 'src/app/model/trajectory'
import {
  InferenceResultStatus,
  InferenceType,
} from 'src/app/shared-services/inferences/engine/types'
import { TrajectoryService } from 'src/app/shared-services/trajectory/trajectory.service'
import {
  InferenceService,
  InferenceServiceEvent,
} from 'src/app/shared-services/inferences/inference.service'
import { FeatureFlagService } from 'src/app/shared-services/feature-flag/feature-flag.service'
import { TimetableService } from 'src/app/shared-services/timetable/timetable.service'
import { DiaryEditComponent } from 'src/app/diary/diary-edit/diary-edit.component'
import { TranslateService } from '@ngx-translate/core'

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
          attribution: this.mapAttributionString,
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ),
    ],
  }
  mapBounds: LatLngBounds
  polyline: Polyline
  inferenceHulls = new LayerGroup()
  lastLocation: CircleMarker
  followPosition: boolean
  suppressNextMapMoveEvent: boolean
  trajectoryType: TrajectoryType

  isInferencesEnabled =
    this.featureFlagService.featureFlags.isTrajectoryInferencesEnabled
  isPredictionsEnabled =
    this.featureFlagService.featureFlags.isTimetablePredicitionEnabled
  inferences: Inference[] = []
  generatedInferences = false
  predictedInferenceIds: string[] = []

  private get mapAttributionString(): string {
    const osmContributors = this.translateService.instant(
      'trajectory.map.osmContributors'
    )
    return `&copy; <a href="https://www.openstreetmap.org/copyright">${osmContributors}</a> &copy; <a href="https://carto.com/attributions">CARTO</a>`
  }

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
    private routerOutlet: IonRouterOutlet,
    private translateService: TranslateService
  ) {}

  async ngOnInit() {
    this.trajectoryId = this.route.snapshot.paramMap.get('trajectoryId')
    this.trajectoryType = this.route.snapshot.paramMap.get(
      'trajectoryType'
    ) as TrajectoryType

    this.trajSubscription = this.trajectoryService
      .getOne(this.trajectoryType, this.trajectoryId)
      .subscribe((t) => {
        this.polyline = new Polyline(t.coordinates, {
          weight: 1,
        })

        const lastMeasurement = {
          location: t.coordinates[t.coordinates.length - 1],
          timestamp: t.timestamps[t.timestamps.length - 1],
        }

        const locale = this.translateService.getBrowserLang()
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
          this.mapBounds = this.polyline.getBounds()
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
    for (const inference of this.inferences) {
      const h = new Polygon(inference.coordinates, {
        color: this.getIconColor(inference),
        weight: 2,
        opacity: inference.confidence || 0,
      })
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
