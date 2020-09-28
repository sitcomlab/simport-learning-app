import { Component, OnInit } from '@angular/core';

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

  constructor() { }

  ngOnInit() {
  }

  enableTrajectory (mode: TrajectoryMode) {
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
        // TODO
        // show selection modal
        // route to /trajectory/{selected id}
        return

      case TrajectoryMode.IMPORT:
        // TODO
        // open file browser
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
