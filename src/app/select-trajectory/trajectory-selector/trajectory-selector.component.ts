import { Component, OnDestroy, OnInit } from '@angular/core'
import { Subscription } from 'rxjs'
import { TrajectoryMeta, TrajectoryType } from 'src/app/model/trajectory'
import { TrajectoryService } from 'src/app/shared-services/trajectory.service'

@Component({
  selector: 'app-trajectory-selector',
  templateUrl: './trajectory-selector.component.html',
  styleUrls: ['./trajectory-selector.component.scss'],
})
export class TrajectorySelectorComponent implements OnInit, OnDestroy {
  trajectories: TrajectoryMeta[]
  trajectoriesSub: Subscription
  loading = true

  constructor(private trajectoryService: TrajectoryService) {}

  async ngOnInit() {
    this.trajectoriesSub = this.trajectoryService
      .getAllMeta()
      .subscribe((ts) => {
        this.loading = false
        this.trajectories = ts.sort((a, b) => {
          // sort in order: USERTRACK - IMPORT - EXAMPLE
          if (a.type !== b.type) {
            if (
              a.type === TrajectoryType.USERTRACK ||
              (a.type === TrajectoryType.IMPORT &&
                b.type === TrajectoryType.EXAMPLE)
            ) {
              return -1
            } else if (
              b.type === TrajectoryType.USERTRACK ||
              (a.type === TrajectoryType.EXAMPLE &&
                b.type === TrajectoryType.IMPORT)
            ) {
              return 1
            }
          }
          return 0
        })
      })
  }

  async ngOnDestroy() {
    this.trajectoriesSub.unsubscribe()
  }
}
