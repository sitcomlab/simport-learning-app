import { Component, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Subscription } from 'rxjs'
import {
  Inference,
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
import {
  IonRouterOutlet,
  ModalController,
  ToastController,
} from '@ionic/angular'
import { InferenceModalComponent } from '../inference-modal/inferences-modal.component'

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
    private modalController: ModalController,
    private router: Router,
    private route: ActivatedRoute,
    private routerOutlet: IonRouterOutlet,
    private translateService: TranslateService
  ) {}

  get hasInferences(): boolean {
    return this.inferences.size > 0
  }

  async ngOnInit() {
    this.trajectoryId = this.route.snapshot.paramMap.get('trajectoryId')
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

  async ionViewDidEnter() {
    await this.reloadInferences(true)
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

  getInferenceTypeIcon(type: string, useOutlined: boolean): string {
    const inf = ALL_INFERENCES[type]
    return useOutlined ? inf.outlinedIcon : inf.icon
  }

  getInferenceTypeColor(type: InferenceType): string {
    const inf = ALL_INFERENCES[type]
    return inf.color
  }

  getInferenceRatingString(inference: Inference): string {
    const rating = InferenceConfidenceThresholds.getQualitativeConfidence(
      inference.confidence
    )
    return this.translateService.instant(`inference.confidence.${rating}`)
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

    const modal = await this.modalController.create({
      component: InferenceModalComponent,
      componentProps: {
        inference,
      },
      presentingElement: this.routerOutlet.nativeEl,
      swipeToClose: true,
      cssClass: 'auto-height',
    })
    await modal.present()
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
