import { Component, OnInit } from '@angular/core'

@Component({
  selector: 'app-inferences',
  templateUrl: './inferences.page.html',
  styleUrls: ['./inferences.page.scss'],
})
export class InferencesPage implements OnInit {
  inferences: Inference[] = [
    { name: 'Home', description: 'We do now know where your home is.' },
    { name: 'Workplace', description: 'We know where you work.' },
  ]

  constructor() {}

  ngOnInit() {}
}
