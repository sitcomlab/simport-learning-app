import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Subscription } from 'rxjs'
import {
  Inference,
  InferenceConfidence,
  InferenceConfidenceThresholds,
} from 'src/app/model/inference'
import { AllInferences } from 'src/app/shared-services/inferences/engine/definitions'
import {
  InferenceService,
  InferenceServiceEvent,
} from 'src/app/shared-services/inferences/inference.service'
import { TrajectoryPagePath } from '../trajectory.page'
import { InferenceType } from 'src/app/shared-services/inferences/engine/types'
import { ReverseGeocodingIcon } from 'src/app/model/reverse-geocoding'

class InferenceListItem {
  inferences: Inference[]
  type: InferenceType
  constructor(inferences: Inference[], type: InferenceType) {
    this.inferences = inferences
    this.type = type
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
        runGeocoding
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
    const def = AllInferences[inference.name]
    if (!def) return inference.name
    return def.getName(this.translateService)
  }

  formatInferenceInfo(inference: Inference): string {
    const def = AllInferences[inference.type]
    if (!def) {
      return this.translateService.instant('inference.unknown', {
        value: inference.name,
      })
    }
    return def.info(inference, this.translateService)
  }

  getInferenceTypeIcon(type: string): string {
    return AllInferences[type].outlinedIcon
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

  getInferencePoiIcon(inference: Inference): string {
    const icon = ReverseGeocodingIcon.getGeocodingIcon(inference.geocoding)
    return icon !== undefined ? `${icon}-outline` : undefined
  }

  showInferenceOnMap(inference: Inference) {
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
}
