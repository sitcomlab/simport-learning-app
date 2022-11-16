import { Component, Input, OnInit } from '@angular/core'
import { ModalController, Platform, PopoverController } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'
import * as moment from 'moment'
import { Trajectory, TrajectoryType } from 'src/app/model/trajectory'
import { FeatureFlagService } from 'src/app/shared-services/feature-flag/feature-flag.service'
import { TrajectoryCardPopoverPage } from './trajectory-card-popover/trajectory-card-popover.page'

@Component({
  selector: 'app-trajectory-card',
  templateUrl: './trajectory-card.component.html',
  styleUrls: ['./trajectory-card.component.scss'],
})
export class TrajectoryCardComponent implements OnInit {
  @Input() trajectory: Trajectory

  constructor(
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
    private platform: Platform,
    private translateService: TranslateService,
    private featureFlagService: FeatureFlagService
  ) {}

  ngOnInit() {}

  showTrajectoryMenu(): boolean {
    if (!this.platform.is('mobile')) return false

    return !(
      this.trajectory.id === 'example' &&
      !this.featureFlagService.featureFlags.isTrajectoryExportEnabled
    )
  }

  durationString() {
    const days = this.trajectory?.durationDays
    if (days) {
      moment.locale(this.translateService.currentLang)
      return moment.duration(days, 'days').humanize()
    }
    return '—'
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
