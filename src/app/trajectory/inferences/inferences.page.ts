import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Subscription } from 'rxjs'
import { Inference } from 'src/app/model/inference'
import { AllInferences } from 'src/app/shared-services/inferences/engine/definitions'
import {
  InferenceService,
  InferenceServiceEvent,
} from 'src/app/shared-services/inferences/inference.service'
import { TrajectoryPagePath } from '../trajectory.page'

@Component({
  selector: 'app-inferences',
  templateUrl: './inferences.page.html',
  styleUrls: ['./inferences.page.scss'],
})
export class InferencesPage implements OnInit, OnDestroy {
  inferences: Inference[] = []

  private trajectoryId: string
  private inferenceFilterSubscription: Subscription

  constructor(
    private inferenceService: InferenceService,
    private router: Router,
    private route: ActivatedRoute,
    private translateService: TranslateService
  ) {}

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
    this.inferences = inferencesResult.inferences.sort(
      (a, b) => b.confidence - a.confidence
    )
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

  showInferenceOnMap(inference: Inference) {
    if (!inference.latLng || !inference.accuracy) return
    this.openMap(inference.latLng)
  }

  openMap(centerLatLon?: [number, number]) {
    this.router.navigate([`../${TrajectoryPagePath.Map}`], {
      relativeTo: this.route,
      state: { center: centerLatLon },
    })
  }

  openInferenceFilter() {
    this.inferenceService.triggerEvent(InferenceServiceEvent.configureFilter)
  }
}
