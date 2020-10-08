import { Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { InferenceService } from './inference.service'

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
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    let trajectoryId = this.router.url.split('/')[2]
    this.inferences = this.service.getInferences(trajectoryId)
  }

  openMap(inference: Inference) {
    if (!inference.location || !inference.accuracy) return
    this.router.navigate([`../../../map`], { relativeTo: this.activatedRoute })
  }
}
