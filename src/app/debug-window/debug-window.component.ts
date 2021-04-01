import { Component, OnInit } from '@angular/core'
import { DeviceInfo, Plugins } from '@capacitor/core'
import { Subscription } from 'rxjs'
import { Trajectory, TrajectoryMeta, TrajectoryType } from '../model/trajectory'
import { LocationService } from '../shared-services/location.service'
import { TrajectoryService } from '../shared-services/trajectory.service'

@Component({
  selector: 'app-debug-window',
  templateUrl: './debug-window.component.html',
  styleUrls: ['./debug-window.component.scss'],
})
export class DebugWindowComponent implements OnInit {
  myDevice: DeviceInfo

  trajectories: TrajectoryMeta[]
  trajectoriesSub: Subscription
  userTrajectory: Trajectory
  importedTrajectories: TrajectoryMeta[]
  loading = true
  trackingRunning: boolean
  notificationsEnabled: boolean

  segment = 'general'

  constructor(
    private trajectoryService: TrajectoryService,
    private locationService: LocationService
  ) {}

  async ngOnInit() {
    this.myDevice = await Plugins.Device.getInfo()

    this.trajectoriesSub = this.trajectoryService
      .getAllMeta()
      .subscribe((ts) => {
        this.trajectories = ts
        const userTrajectory = ts.find((t) => t.type === 'track') // currently only zero or one user trajectory in db
        this.importedTrajectories = ts.filter((t) => t.type === 'import')

        if (userTrajectory) {
          this.trajectoryService
            .getOne(TrajectoryType.USERTRACK, userTrajectory.id)
            .subscribe((ut) => {
              this.userTrajectory = ut
            })
        }
        this.loading = false
      })

    this.locationService.isRunning.subscribe(
      (running) => (this.trackingRunning = running)
    )

    this.locationService.notificationsEnabled.subscribe(
      (ne) => (this.notificationsEnabled = ne)
    )
  }

  segmentChanged(ev: any) {
    this.segment = ev.target.value
  }
}
