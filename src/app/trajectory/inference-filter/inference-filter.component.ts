import { Component, OnDestroy } from '@angular/core'
import { InferenceService } from 'src/app/shared-services/inferences/inference.service'
import { KeyValuePipe } from '@angular/common'

@Component({
  selector: 'app-inference-filter',
  templateUrl: './inference-filter.component.html',
  styleUrls: ['./inference-filter.component.scss'],
})
export class InferenceFilterComponent implements OnDestroy {
  static inferenceFilterEvent = 'inference-filter-event'

  filterConfiguration = this.inferenceService.filterConfiguration.value

  constructor(private inferenceService: InferenceService) {}

  get confidenceThreshold(): number {
    return this.filterConfiguration.confidenceThreshold * 100
  }
  set confidenceThreshold(value: number) {
    this.filterConfiguration.confidenceThreshold = value / 100.0
  }

  get inferenceVisiblities() {
    return this.filterConfiguration.inferenceVisiblities
  }

  ngOnDestroy() {
    this.inferenceService.filterConfiguration.next(this.filterConfiguration)
  }

  closeComponent() {}
}
