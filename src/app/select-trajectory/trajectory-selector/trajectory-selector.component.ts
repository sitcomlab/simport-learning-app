import { Component, OnDestroy, OnInit } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { Subscription } from 'rxjs'
import { TrajectoryMeta } from 'src/app/model/trajectory'
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

  constructor(
    private modalCtrl: ModalController,
    private trajectoryService: TrajectoryService
  ) {}

  async ngOnInit() {
    this.trajectoriesSub = this.trajectoryService
      .getAllMeta()
      .subscribe((ts) => {
        this.loading = false
        this.trajectories = ts
      })
  }

  async ngOnDestroy() {
    this.trajectoriesSub.unsubscribe()
  }

  select(t: TrajectoryMeta) {
    this.modalCtrl.dismiss(t)
  }
}
