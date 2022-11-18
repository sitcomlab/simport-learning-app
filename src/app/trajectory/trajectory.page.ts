import { Component, OnDestroy, OnInit } from '@angular/core'
import { IonRouterOutlet, ModalController } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'
import { Subscription } from 'rxjs'
import { FeatureFlagService } from '../shared-services/feature-flag/feature-flag.service'
import {
  InferenceService,
  InferenceServiceEvent,
} from '../shared-services/inferences/inference.service'
import { InferenceFilterComponent } from './inference-filter/inference-filter.component'

export interface TrajectoryPageTab {
  path: string
  icon: string
  title: string
}

export enum TrajectoryPagePath {
  inferences = 'trajectory-inferences',
  map = 'trajectory-map',
  exploration = 'trajectory-exploration',
  inferenceFilter = 'trajectory-inference-filter',
}

@Component({
  selector: 'app-trajectory',
  templateUrl: './trajectory.page.html',
  styleUrls: ['./trajectory.page.scss'],
})
export class TrajectoryPage implements OnInit, OnDestroy {
  tabs: TrajectoryPageTab[] = []
  private inferenceFilterSubscription: Subscription

  constructor(
    private modalController: ModalController,
    private routerOutlet: IonRouterOutlet,
    private inferenceService: InferenceService,
    private featureFlagService: FeatureFlagService,
    private translateService: TranslateService
  ) {
    if (this.featureFlagService.featureFlags.isTrajectoryInferencesTabEnabled) {
      this.tabs.push({
        path: TrajectoryPagePath.inferences,
        icon: 'magnet-outline',
        title: this.translateService.instant('trajectory.insights.title'),
      })
    }
    if (this.featureFlagService.featureFlags.isNotificationShownForInferences) {
      this.tabs.push({
        path: TrajectoryPagePath.map,
        icon: 'map-outline',
        title: this.translateService.instant('trajectory.map.title'),
      })
    }
    if (
      this.featureFlagService.featureFlags.isTrajectoryExplorationTabEnabled
    ) {
      this.tabs.push({
        path: TrajectoryPagePath.exploration,
        icon: 'bar-chart-outline',
        title: this.translateService.instant('trajectory.explore.title'),
      })
    }
  }

  ngOnInit() {
    this.inferenceFilterSubscription =
      this.inferenceService.inferenceServiceEvent.subscribe(async (event) => {
        if (event === InferenceServiceEvent.configureFilter) {
          await this.openInferenceFilter()
        }
      })
  }

  ngOnDestroy() {
    this.inferenceFilterSubscription.unsubscribe()
  }

  async openInferenceFilter() {
    const modal = await this.modalController.create({
      component: InferenceFilterComponent,
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      cssClass: 'auto-height',
    })
    modal.present()
    const { data: t } = await modal.onWillDismiss<void>()
  }
}
