import { Component, Input, OnInit } from '@angular/core'
import { Trajectory } from 'src/app/model/trajectory'

@Component({
  selector: 'app-trajectory-card',
  templateUrl: './trajectory-card.component.html',
  styleUrls: ['./trajectory-card.component.scss'],
})
export class TrajectoryCardComponent implements OnInit {
  @Input() trajectory: Trajectory

  constructor() {}

  ngOnInit() {}
}
