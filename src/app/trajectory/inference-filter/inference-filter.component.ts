import { Component, OnDestroy } from '@angular/core'
import { InferenceService } from 'src/app/shared-services/inferences/inference.service'
import { ALL_INFERENCES } from 'src/app/shared-services/inferences/engine/definitions'
import { InferenceConfidenceThresholds } from 'src/app/model/inference'
import { ModalController } from '@ionic/angular'

@Component({
  selector: 'app-inference-filter',
  templateUrl: './inference-filter.component.html',
  styleUrls: ['./inference-filter.component.scss'],
})
export class InferenceFilterComponent implements OnDestroy {
  static inferenceFilterEvent = 'inference-filter-event'

  filterConfiguration = this.inferenceService.filterConfiguration.value
  confidenceThresholdCutoffs = InferenceConfidenceThresholds

  constructor(
    private inferenceService: InferenceService,
    private modalController: ModalController
  ) {}

  get inferenceVisiblities(): Map<string, boolean> {
    return this.filterConfiguration.inferenceVisiblities
  }

  get confidenceThreshold(): number {
    return this.filterConfiguration.confidenceThreshold
  }

  set confidenceThreshold(value: number) {
    this.filterConfiguration.confidenceThreshold = value
  }

  onInferenceVisibilityChanged(type: string) {
    const oldValue = this.filterConfiguration.inferenceVisiblities.get(type)
    this.filterConfiguration.inferenceVisiblities.set(type, !oldValue)
  }

  getIconFromInferenceType(type: string) {
    return ALL_INFERENCES[type].outlinedIcon
  }

  getTitleKeyFromInferenceType(type: string) {
    return `inference.${type}`
  }

  ngOnDestroy() {
    this.inferenceService.filterConfiguration.next(this.filterConfiguration)
  }

  async closeComponent() {
    await this.modalController.dismiss()
  }
}
