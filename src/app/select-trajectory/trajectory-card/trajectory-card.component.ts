import { Component, Input, OnInit } from '@angular/core';
import * as moment from 'moment';
import { Trajectory } from 'src/model/trajectory';

@Component({
  selector: 'app-trajectory-card',
  templateUrl: './trajectory-card.component.html',
  styleUrls: ['./trajectory-card.component.scss'],
})
export class TrajectoryCardComponent implements OnInit {
  @Input('trajectory') t: Trajectory

  constructor() { }

  ngOnInit() {}

  get duration () {
    const { timestamps: ts } = this.t
    if (!ts || !ts.length) return ''
    const t1 = moment(ts[0])
    const t2 = moment(ts[ts.length - 1])
    return t1.from(t2, true)
  }

}
