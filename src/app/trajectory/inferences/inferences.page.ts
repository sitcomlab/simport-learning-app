import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Subscription } from 'rxjs'
import {
  Inference,
  InferenceConfidence,
  InferenceConfidenceThresholds,
} from 'src/app/model/inference'
import { ALL_INFERENCES } from 'src/app/shared-services/inferences/engine/definitions'
import {
  InferenceService,
  InferenceServiceEvent,
} from 'src/app/shared-services/inferences/inference.service'
import { TrajectoryPagePath } from '../trajectory.page'
import { InferenceType } from 'src/app/shared-services/inferences/engine/types'
import { ReverseGeocodingIcon } from 'src/app/model/reverse-geocoding'
import { ToastController } from '@ionic/angular'

class InferenceListItem {
  inferences: Inference[]
  type: InferenceType
  constructor(inferences: Inference[], type: InferenceType) {
    this.inferences = inferences
    this.type = type
  }

  get hasInferences(): boolean {
    return this.inferences.length > 0
  }

  get primaryInferences(): Inference[] {
    if (this.type === InferenceType.poi) {
      return this.inferences.slice(0, 3)
    }
    return this.inferences.slice(0, 1)
  }

  get secondaryInferences(): Inference[] {
    if (this.type === InferenceType.poi) {
      return this.inferences.slice(3)
    }
    return this.inferences.slice(1)
  }
}

@Component({
  selector: 'app-inferences',
  templateUrl: './inferences.page.html',
  styleUrls: ['./inferences.page.scss'],
})
export class InferencesPage implements OnInit, OnDestroy {
  inferences: Map<InferenceType, InferenceListItem> = new Map()

  private trajectoryId: string
  private inferenceFilterSubscription: Subscription

  constructor(
    private inferenceService: InferenceService,
    private toastController: ToastController,
    private router: Router,
    private route: ActivatedRoute,
    private translateService: TranslateService
  ) {}

  get hasInferences(): boolean {
    return this.inferences.size > 0
  }

  async ngOnInit() {
    this.trajectoryId = this.route.snapshot.paramMap.get('trajectoryId')
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
    if (this.inferenceFilterSubscription) {
      this.inferenceFilterSubscription.unsubscribe()
    }
  }

  async reloadInferences(runGeocoding: boolean = false): Promise<void> {
    const inferencesResult =
      await this.inferenceService.loadPersistedInferences(
        this.trajectoryId,
        runGeocoding,
        false
      )
    const sortedInferences = inferencesResult.inferences.sort(
      (a, b) => b.confidence - a.confidence
    )
    Object.keys(InferenceType).forEach((t) => {
      this.inferences.set(
        t as InferenceType,
        new InferenceListItem(
          sortedInferences.filter((i) => i.type === t),
          t as InferenceType
        )
      )
    })
  }

  formatInferenceName(inference: Inference): string {
    const def = ALL_INFERENCES[inference.name]
    if (!def) return inference.name
    return def.getName(this.translateService)
  }

  formatInferenceInfo(inference: Inference): string {
    const def = ALL_INFERENCES[inference.type]
    if (!def) {
      return this.translateService.instant('inference.unknown', {
        value: inference.name,
      })
    }
    return def.info(inference, this.translateService)
  }

  getInferenceTypeIcon(type: string, useOutlined: boolean): string {
    const inf = ALL_INFERENCES[type]
    return useOutlined ? inf.outlinedIcon : inf.icon
  }

  getInferenceTypeColor(type: InferenceType): string {
    const inf = ALL_INFERENCES[type]
    return inf.color
  }

  getInferenceRatingColor(inference: Inference): string {
    const rating = InferenceConfidenceThresholds.getQualitativeConfidence(
      inference.confidence
    )
    switch (rating) {
      case InferenceConfidence.high:
        return 'success'
      case InferenceConfidence.medium:
        return 'warning'
      default:
        return 'danger'
    }
  }

  getInferenceRatingString(inference: Inference): string {
    const rating = InferenceConfidenceThresholds.getQualitativeConfidence(
      inference.confidence
    )
    return this.translateService.instant(`inference.confidence.${rating}`)
  }

  getInferencePoiIcon(inference: Inference): string {
    const icon = ReverseGeocodingIcon.getGeocodingIcon(inference.geocoding)
    return icon !== undefined ? `${icon}-outline` : undefined
  }

  showInferenceOnMap(e: Event, inference: Inference) {
    e.stopPropagation()
    if (!inference.latLng) return
    this.openMap(inference.latLng)
  }

  openMap(centerLatLon?: [number, number]) {
    this.router.navigate([`../${TrajectoryPagePath.map}`], {
      relativeTo: this.route,
      state: { center: centerLatLon },
    })
  }

  openInferenceFilter() {
    this.inferenceService.triggerEvent(InferenceServiceEvent.configureFilter)
  }

  async showInferenceToast(e: Event, inference: Inference) {
    e.stopPropagation()
    let icon: string
    if (inference.type === InferenceType.poi) {
      icon = this.getInferencePoiIcon(inference)
    } else {
      icon = inference.icon
    }
    const cssClass = inference.type
    const message = this.formatInferenceInfo(inference)
    await this.showInfoToast(message, inference.icon, cssClass)
  }

  async showInfoToast(
    message: string,
    icon: string = undefined,
    cssClass: string = undefined
  ) {
    const toast = await this.toastController.create({
      message,
      icon,
      cssClass,
      position: 'bottom',
      duration: 4000,
    })

    try {
      await this.toastController.dismiss()
    } catch (error) {
      // no previous toast to dismiss
    } finally {
      await toast.present()
    }
  }
}
