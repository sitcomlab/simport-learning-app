import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { SelectTrajectoryPageRoutingModule } from './select-trajectory-routing.module'

import { SelectTrajectoryPage } from './select-trajectory.page'
import { TrajectorySelectorComponent } from './trajectory-selector/trajectory-selector.component'
import { TrajectoryCardComponent } from './trajectory-card/trajectory-card.component'
import { TrajectoryCardPopoverPage } from './trajectory-card/trajectory-card-popover/trajectory-card-popover.page'
import { SharedUiModule } from '../shared-ui/shared-ui.module'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SelectTrajectoryPageRoutingModule,
    SharedUiModule,
  ],
  declarations: [
    SelectTrajectoryPage,
    TrajectorySelectorComponent,
    TrajectoryCardComponent,
    TrajectoryCardPopoverPage,
  ],
})
export class SelectTrajectoryPageModule {}
