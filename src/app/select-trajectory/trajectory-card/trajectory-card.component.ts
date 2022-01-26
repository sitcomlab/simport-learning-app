import { Component, Input, OnInit } from '@angular/core'
import { ModalController, Platform, PopoverController } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'
import * as moment from 'moment'
import { Trajectory, TrajectoryMeta } from 'src/app/model/trajectory'
import { TrajectoryCardPopoverPage } from './trajectory-card-popover/trajectory-card-popover.page'

@Component({
  selector: 'app-trajectory-card',
  templateUrl: './trajectory-card.component.html',
  styleUrls: ['./trajectory-card.component.scss'],
})
export class TrajectoryCardComponent implements OnInit {
  @Input() trajectory: TrajectoryMeta

  constructor(
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
    private platform: Platform,
    private translateService: TranslateService
  ) {}

  ngOnInit() {}

  showTrajectoryMenu(): boolean {
    return this.platform.is('mobile')
  }

  durationString() {
    const days = this.trajectory?.durationDays
    return days ? moment.duration(days, 'days').humanize() : '—'
  }

  placename(): string {
    if (this.trajectory.id === Trajectory.trackingTrajectoryID) {
      return this.translateService.instant(
        'selectTrajectory.userTrajectoryTitle'
      )
    }
    return this.trajectory.placename
  }

  selectTrajectory() {
    this.modalCtrl.dismiss(this.trajectory)
  }

  async presentPopover(e: Event) {
    e.stopPropagation()
    const popover = await this.popoverCtrl.create({
      component: TrajectoryCardPopoverPage,
      event: e,
      translucent: true,
      componentProps: { trajectory: this.trajectory },
    })
    return await popover.present()
  }
}
