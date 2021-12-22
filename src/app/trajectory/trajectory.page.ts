import { Component, OnDestroy, OnInit } from '@angular/core'
import { IonRouterOutlet, ModalController } from '@ionic/angular'
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
  Inferences = 'trajectory-inferences',
  Map = 'trajectory-map',
  Exploration = 'trajectory-exploration',
  InferenceFilter = 'trajectory-inference-filter',
}

@Component({
  selector: 'app-trajectory',
  templateUrl: './trajectory.page.html',
  styleUrls: ['./trajectory.page.scss'],
})
export class TrajectoryPage implements OnInit, OnDestroy {
  private inferenceFilterSubscription: Subscription

  tabs: TrajectoryPageTab[] = []

  constructor(
    private modalController: ModalController,
    private routerOutlet: IonRouterOutlet,
    private inferenceService: InferenceService,
    private featureFlagService: FeatureFlagService
  ) {
    if (this.featureFlagService.featureFlags.isTrajectoryInferencesEnabled) {
      this.tabs.push({
        path: TrajectoryPagePath.Inferences,
        icon: 'magnet-outline',
        title: 'Insights',
      })
    }
    if (this.featureFlagService.featureFlags.isTrajectoryMapEnabled) {
      this.tabs.push({
        path: TrajectoryPagePath.Map,
        icon: 'map-outline',
        title: 'Map',
      })
    }
    if (this.featureFlagService.featureFlags.isTrajectoryExplorationEnabled) {
      this.tabs.push({
        path: TrajectoryPagePath.Exploration,
        icon: 'bar-chart-outline',
        title: 'Explore',
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
