import { Component, OnDestroy, OnInit } from '@angular/core'
import { DeviceInfo, Plugins } from '@capacitor/core'
import { ModalController } from '@ionic/angular'
import { Subscription } from 'rxjs'
import { Trajectory, TrajectoryMeta, TrajectoryType } from '../model/trajectory'
import { LocationService } from '../shared-services/location.service'
import { TrajectoryService } from '../shared-services/trajectory.service'

@Component({
  selector: 'app-debug-window',
  templateUrl: './debug-window.component.html',
  styleUrls: ['./debug-window.component.scss'],
})
export class DebugWindowComponent implements OnInit, OnDestroy {
  myDevice: Record<keyof DeviceInfo, any>
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
    this.myDevice = (await Plugins.Device.getInfo()) as Record<
      keyof DeviceInfo,
      any
    >

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
      this.locationService.isRunning.subscribe(
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
