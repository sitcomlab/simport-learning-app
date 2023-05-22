import { Component, Input } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'
import { Inference } from 'src/app/model/inference'
import { ALL_INFERENCES } from 'src/app/shared-services/inferences/engine/definitions'

@Component({
  selector: 'app-inference-modal',
  templateUrl: './inferences-modal.component.html',
  styleUrls: ['./inferences-modal.component.scss'],
})
export class InferenceModalComponent {
  @Input() inference: Inference

  constructor(
    private translateService: TranslateService,
    private modalController: ModalController
  ) {}

  get formattedInferenceInfo(): string {
    const def = ALL_INFERENCES[this.inference.type]
    if (!def) {
      return this.translateService.instant('inference.unknown', {
        value: this.inference.name,
      })
    }
    return def.info(this.inference, this.translateService)
  }

  async onShowOnMapClick() {
    await this.modalController.dismiss({ openMap: true })
  }

  async closeComponent() {
    await this.modalController.dismiss()
  }
}
