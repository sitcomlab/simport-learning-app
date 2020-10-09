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
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const trajId = this.route.snapshot.paramMap.get('trajectoryId')
    this.inferences = this.service.getInferences(trajId)
  }

  openMap(inference: Inference) {
    if (!inference.location || !inference.accuracy) return
    this.router.navigate(['../map'], { relativeTo: this.route })
  }
}
