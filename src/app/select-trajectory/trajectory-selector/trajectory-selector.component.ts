import { Component, Input, OnInit } from '@angular/core'
import { ModalController } from '@ionic/angular'
import { Trajectory } from 'src/app/model/trajectory'
import { TrajectoryService } from 'src/app/shared-services/trajectory.service'

@Component({
  selector: 'app-trajectory-selector',
  templateUrl: './trajectory-selector.component.html',
  styleUrls: ['./trajectory-selector.component.scss'],
})
export class TrajectorySelectorComponent implements OnInit {
  trajectories: Trajectory[]

  constructor(
    private modalCtrl: ModalController,
    private trajectoryService: TrajectoryService
  ) {
  }

  async ngOnInit() {
    this.trajectories = await this.trajectoryService.getAllTrajectories()
  }

  select(id: string) {
    this.modalCtrl.dismiss(id)
  }
}
