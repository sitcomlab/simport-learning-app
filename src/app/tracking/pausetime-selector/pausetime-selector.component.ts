import { Component, OnInit } from '@angular/core'
import { ModalController, NavParams } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'

@Component({
  selector: 'app-pausetime-selector',
  templateUrl: './pausetime-selector.component.html',
  styleUrls: ['./pausetime-selector.component.scss'],
})
export class PausetimeSelectorComponent implements OnInit {
  pauseOptions = [
    {
      text: this.translateService.instant('tracking.dontRemind'),
      value: 0,
    },
    {
      text:
        this.translateService.instant('tracking.remind') +
        ' 30 ' +
        this.translateService.instant('tracking.minutes'),
      value: 30,
    },
    {
      text:
        this.translateService.instant('tracking.remind') +
        ' 60 ' +
        this.translateService.instant('tracking.minutes'),
      value: 60,
    },
    {
      text:
        this.translateService.instant('tracking.remind') +
        ' 90 ' +
        this.translateService.instant('tracking.minutes'),
      value: 90,
    },
    {
      text:
        this.translateService.instant('tracking.remind') +
        ' 2 ' +
        this.translateService.instant('tracking.hours'),
      value: 120,
    },
    {
      text:
        this.translateService.instant('tracking.remind') +
        ' 3 ' +
        this.translateService.instant('tracking.hours'),
      value: 180,
    },
    {
      text:
        this.translateService.instant('tracking.remind') +
        ' 4 ' +
        this.translateService.instant('tracking.hours'),
      value: 240,
      default: false,
    },
  ]

  selectedPauseMinutes: number

  constructor(
    private modalController: ModalController,
    private translateService: TranslateService
  ) {}

  ngOnInit() {}

  onPauseSelection(event) {
    this.selectedPauseMinutes = event.detail.value
  }

  confirmPause() {
    const response = {
      confirmStop: true,
      selectedPauseMinutes: this.selectedPauseMinutes,
    }
    this.modalController.dismiss(response)
  }

  cancelPause() {
    const response = {
      confirmStop: false,
    }
    this.modalController.dismiss(response)
  }
}
