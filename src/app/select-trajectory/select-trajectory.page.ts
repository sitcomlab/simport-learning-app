import { Component, OnInit } from '@angular/core';
import { IonRouterOutlet, ModalController } from '@ionic/angular';
import { TrajectorySelectorComponent } from './trajectory-selector/trajectory-selector.component';

enum TrajectoryMode {
  TRACK = 'tracking',
  CHOOSE = 'choose',
  IMPORT = 'import',
}

@Component({
  selector: 'app-select-trajectory',
  templateUrl: './select-trajectory.page.html',
  styleUrls: ['./select-trajectory.page.scss'],
})
export class SelectTrajectoryPage implements OnInit {

  constructor(
    private modalController: ModalController,
    private routerOutlet: IonRouterOutlet,
  ) {}

  ngOnInit() {
  }

  async enableTrajectory (mode: TrajectoryMode) {
    console.log(mode)

    // TODO: persist selected mode

    switch (mode) {
      case TrajectoryMode.TRACK:
        // TODO
        // check location permission
        // enable background tracking
        // route to /trajectory/tracking
        return

      case TrajectoryMode.CHOOSE:
        const modal = await this.modalController.create({
          component: TrajectorySelectorComponent,
          swipeToClose: true,
          presentingElement: this.routerOutlet.nativeEl,
          cssClass: 'auto-height'
        })
        return await modal.present()

      case TrajectoryMode.IMPORT:
        // TODO
        // open file browser (maybe https://github.com/hinddeep/capacitor-file-selector ?)
        // persist trajectory, assign id
        // route to /trajectory/{assigned id}
        return
      default:
        assertUnreachable(mode)
    }
  }

}

function assertUnreachable(x: never): never {
  throw new Error('code should be unreachable')
}
