import { Component, OnDestroy, OnInit } from '@angular/core'
import { IonRouterOutlet, ModalController } from '@ionic/angular'
import { Subscription } from 'rxjs'
import {
  InferenceService,
  InferenceServiceEvent,
} from '../shared-services/inferences/inference.service'
import { InferenceFilterComponent } from './inference-filter/inference-filter.component'

@Component({
  selector: 'app-trajectory',
  templateUrl: './trajectory.page.html',
  styleUrls: ['./trajectory.page.scss'],
})
export class TrajectoryPage implements OnInit, OnDestroy {
  private inferenceFilterSubscription: Subscription

  constructor(
    private modalController: ModalController,
    private routerOutlet: IonRouterOutlet,
    private inferenceService: InferenceService
  ) {}

  ngOnInit() {
    this.inferenceFilterSubscription = this.inferenceService.inferenceServiceEvent.subscribe(
      async (event) => {
        if (event === InferenceServiceEvent.configureFilter) {
          await this.openInferenceFilter()
        }
      }
    )
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
