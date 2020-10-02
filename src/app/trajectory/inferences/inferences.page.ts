import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { InferenceService } from './inference.service'

@Component({
  selector: 'app-inferences',
  templateUrl: './inferences.page.html',
  styleUrls: ['./inferences.page.scss'],
})
export class InferencesPage implements OnInit {
  inferences: Inference[]

  constructor(private service: InferenceService, private router: Router) {}

  ngOnInit() {
    this.inferences = this.service.getInferences()
  }

  openMap(inference: Inference) {
    if (!inference.location || !inference.accuracy) return
    this.router.navigate([`/trajectory/${inference.trajectoryId}/map`])
  }
}
