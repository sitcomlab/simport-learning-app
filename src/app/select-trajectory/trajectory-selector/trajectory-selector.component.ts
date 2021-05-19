import { Component, OnDestroy, OnInit } from '@angular/core'
import { Subscription } from 'rxjs'
import { TrajectoryMeta, TrajectoryType } from 'src/app/model/trajectory'
import { TrajectoryService } from 'src/app/shared-services/trajectory/trajectory.service'

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
          return this.getSortingIndex(a) - this.getSortingIndex(b)
        })
      })
  }

  private getSortingIndex(meta: TrajectoryMeta): number {
    switch (meta.type) {
      case TrajectoryType.USERTRACK:
        return 0
      case TrajectoryType.IMPORT:
        return 1
      case TrajectoryType.EXAMPLE:
        return 2
      default:
        return -1
    }
  }

  async ngOnDestroy() {
    this.trajectoriesSub.unsubscribe()
  }
}
