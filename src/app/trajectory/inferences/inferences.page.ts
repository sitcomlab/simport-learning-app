import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Inference } from 'src/app/model/inference'
import { AllInferences } from 'src/app/shared-services/inferences/engine/definitions'
import { InferenceService } from 'src/app/shared-services/inferences/inference.service'

@Component({
  selector: 'app-inferences',
  templateUrl: './inferences.page.html',
  styleUrls: ['./inferences.page.scss'],
})
export class InferencesPage implements OnInit {
  inferences: Inference[]

  constructor(
    private service: InferenceService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    const trajId = this.route.snapshot.paramMap.get('trajectoryId')
    const inferencesResult = this.service.loadPersistedInferences(trajId)
    this.inferences = inferencesResult.inferences
  }

  formatInferenceName(inference: Inference): string {
    const def = AllInferences[inference.name]
    if (!def) return inference.name
    return def.name()
  }

  formatInferenceInfo(inference: Inference): string {
    const def = AllInferences[inference.name]
    if (!def) return `unknown inference ${inference.name}`
    return def.info(inference)
  }

  showInferenceOnMap(inference: Inference) {
    if (!inference.lonLat || !inference.accuracy) return
    this.openMap(inference.lonLat)
  }

  openMap(centerLatLng?: [number, number]) {
    this.router.navigate(['../map'], {
      relativeTo: this.route,
      state: { center: centerLatLng },
    })
  }
}
