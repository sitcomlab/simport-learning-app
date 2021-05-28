import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Inference } from 'src/app/model/inference'
import { AllInferences } from 'src/app/shared-services/inferences/engine/definitions'
import { InferenceType } from 'src/app/shared-services/inferences/engine/types'
import { InferenceService } from 'src/app/shared-services/inferences/inference.service'

@Component({
  selector: 'app-inferences',
  templateUrl: './inferences.page.html',
  styleUrls: ['./inferences.page.scss'],
})
export class InferencesPage implements OnInit {
  inferences: Inference[] = []

  constructor(
    private service: InferenceService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    const trajId = this.route.snapshot.paramMap.get('trajectoryId')
    const inferencesResult = await this.service.loadPersistedInferences(trajId)
    this.inferences = inferencesResult.inferences
  }

  formatInferenceName(inference: Inference): string {
    const def = AllInferences[inference.name]
    if (!def) return inference.name
    return def.name()
  }

  formatInferenceInfo(inference: Inference): string {
    const def = AllInferences[inference.type]
    if (!def) return `Unknown inference ${inference.name}`
    return def.info(inference)
  }

  getInferenceIcon(inference: Inference): string {
    switch (inference.type) {
      case InferenceType.home:
        return 'home-outline'
      case InferenceType.work:
        return 'business-outline'
      default:
        return 'help-outline'
    }
  }

  showInferenceOnMap(inference: Inference) {
    if (!inference.latLng || !inference.accuracy) return
    this.openMap(inference.latLng)
  }

  openMap(centerLatLon?: [number, number]) {
    this.router.navigate(['../map'], {
      relativeTo: this.route,
      state: { center: centerLatLon },
    })
  }
}
