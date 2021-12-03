import { Component, OnDestroy, OnInit } from '@angular/core'
import { IonRouterOutlet, ModalController } from '@ionic/angular'
import { Subscription } from 'rxjs'
import { FeatureFlag } from '../shared-services/feature-flag/feature-flag.fixtures'
import { FeatureFlagService } from '../shared-services/feature-flag/feature-flag.service'
import {
  InferenceService,
  InferenceServiceEvent,
} from '../shared-services/inferences/inference.service'
import { InferenceFilterComponent } from './inference-filter/inference-filter.component'
import { TrajectoryPagePath } from './trajectory-routing.module'

export interface TrajectoryPageTab {
  path: string
  icon: string
  title: string
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
    if (
      this.featureFlagService.hasFeatureFlag(FeatureFlag.TrajectoryInferences)
    ) {
      this.tabs.push({
        path: TrajectoryPagePath.Inferences,
        icon: 'magnet-outline',
        title: 'Insights',
      })
    }
    if (this.featureFlagService.hasFeatureFlag(FeatureFlag.TrajectoryMap)) {
      this.tabs.push({
        path: TrajectoryPagePath.Map,
        icon: 'map-outline',
        title: 'Map',
      })
    }
    if (
      this.featureFlagService.hasFeatureFlag(FeatureFlag.TrajectoryExploration)
    ) {
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
