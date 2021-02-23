import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { IonRouterOutlet, ModalController } from '@ionic/angular'
import { TrajectoryMeta } from '../model/trajectory'
import { LocationService } from '../shared-services/location.service'
import { TrajectorySelectorComponent } from './trajectory-selector/trajectory-selector.component'
import { TrajectoryImportExportService } from '../shared-services/trajectory-import-export.service'

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
    private router: Router,
    private trajectoryImportExportService: TrajectoryImportExportService,
    public locationService: LocationService
  ) {}

  ngOnInit() {}

  async enableTrajectory(mode: TrajectoryMode) {
    // TODO: persist selected mode

    switch (mode) {
      case TrajectoryMode.TRACK:
        this.router.navigate(['/tracking'])
        return

      case TrajectoryMode.CHOOSE:
        const modal = await this.modalController.create({
          component: TrajectorySelectorComponent,
          swipeToClose: true,
          presentingElement: this.routerOutlet.nativeEl,
          cssClass: 'auto-height',
        })
        modal.present()
        const { data: t } = await modal.onWillDismiss<TrajectoryMeta>()
        if (t) this.router.navigate([`/trajectory/${t.type}/${t.id}`])
        return

      case TrajectoryMode.IMPORT:
        await this.trajectoryImportExportService.selectAndImportFile()
        return

      default:
        assertUnreachable(mode)
    }
  }
}

function assertUnreachable(x: never): never {
  throw new Error('code should be unreachable')
}
