import { Component, Input, OnInit } from '@angular/core'
import * as moment from 'moment'
import { TrajectoryMeta } from 'src/app/model/trajectory'

@Component({
  selector: 'app-trajectory-card',
  templateUrl: './trajectory-card.component.html',
  styleUrls: ['./trajectory-card.component.scss'],
})
export class TrajectoryCardComponent implements OnInit {
  @Input() trajectory: TrajectoryMeta

  constructor() {}

  ngOnInit() {}

  durationString() {
    const days = this.trajectory.durationDays
    return days ? moment.duration(days, 'days').humanize() : '—'
  }
}
