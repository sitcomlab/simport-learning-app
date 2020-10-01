import { Component, OnInit } from '@angular/core'
import { InferenceService } from './inference.service'

@Component({
  selector: 'app-inferences',
  templateUrl: './inferences.page.html',
  styleUrls: ['./inferences.page.scss'],
})
export class InferencesPage implements OnInit {
  inferences: Inference[]

  constructor(private service: InferenceService) {}

  ngOnInit() {
    this.inferences = this.service.getInferences()
  }
}
