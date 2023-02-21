import { Component, OnDestroy, OnInit } from '@angular/core'
import { Device, DeviceInfo } from '@capacitor/device'
import { ModalController } from '@ionic/angular'
import { Subscription } from 'rxjs'
import { Trajectory, TrajectoryMeta, TrajectoryType } from '../model/trajectory'
import { LocationService } from '../shared-services/location/location.service'
import { TrajectoryService } from '../shared-services/trajectory/trajectory.service'
import { App, AppInfo } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

@Component({
  selector: 'app-debug-window',
  templateUrl: './debug-window.component.html',
  styleUrls: ['./debug-window.component.scss'],
})
export class DebugWindowComponent implements OnInit, OnDestroy {
  deviceInfo: DeviceInfo
  appInfo: AppInfo
  trajectories: TrajectoryMeta[]
  userTrajectory: Trajectory
  importedTrajectories: TrajectoryMeta[]
  loading = true
  trackingRunning: boolean
  notificationsEnabled: boolean
  segment = 'general'
  showHistory = false

  private subscriptions: Subscription[] = []

  constructor(
    private trajectoryService: TrajectoryService,
    private locationService: LocationService,
    private modalController: ModalController
  ) {}

  async ngOnInit() {
    // on web @capacitor/app is not working
    if (Capacitor.getPlatform() !== 'web') {
      this.appInfo = await App.getInfo()
    }

    this.deviceInfo = await Device.getInfo()

    this.subscriptions.push(
      this.trajectoryService.getAllMeta().subscribe((ts) => {
        this.trajectories = ts
        // currently only zero or one user trajectory in db
        const userTrajectory = ts.find(
          (t) => t.type === TrajectoryType.USERTRACK
        )
        this.importedTrajectories = ts.filter(
          (t) => t.type === TrajectoryType.IMPORT
        )

        if (userTrajectory) {
          this.subscriptions.push(
            this.trajectoryService
              .getOne(TrajectoryType.USERTRACK, userTrajectory.id)
              .subscribe((ut) => {
                this.userTrajectory = ut
              })
          )
        }
        this.loading = false
      })
    )

    this.subscriptions.push(
      this.locationService.trackingRunning.subscribe(
        (running) => (this.trackingRunning = running)
      )
    )

    this.subscriptions.push(
      this.locationService.notificationsEnabled.subscribe(
        (ne) => (this.notificationsEnabled = ne)
      )
    )
  }

  async ngOnDestroy() {
    for (const sub of this.subscriptions) sub.unsubscribe()
  }

  segmentChanged(ev: any) {
    this.segment = ev.target.value
  }

  dismissModal() {
    this.modalController.dismiss()
  }
}
