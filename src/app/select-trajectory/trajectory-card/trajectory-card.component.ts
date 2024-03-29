import { Component, Input, OnInit } from '@angular/core'
import { ModalController, Platform, PopoverController } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'
import { formatDuration, intervalToDuration } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
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
      const duration = intervalToDuration({
        start: 0,
        end: days * 24 * 60 * 60 * 1000, // days to milliseconds
      })

      // calculate the two highest units to display
      const getFormat = (dur: Duration) => {
        if (dur.months > 1 || dur.weeks >= 4) {
          return ['months', 'days']
        }
        if (dur.days >= 1) {
          return ['days', 'hours']
        }
        return ['hours', 'minutes']
      }

      return formatDuration(duration, {
        format: getFormat(duration),
        locale: this.translateService.currentLang === 'de' ? de : enUS,
      })
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
