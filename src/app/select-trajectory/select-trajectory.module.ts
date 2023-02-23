import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { SelectTrajectoryPageRoutingModule } from './select-trajectory-routing.module'

import { SelectTrajectoryPage } from './select-trajectory.page'
import { TrajectorySelectorComponent } from './trajectory-selector/trajectory-selector.component'
import { DebugWindowComponent } from './../debug-window/debug-window.component'
import { TrajectoryCardComponent } from './trajectory-card/trajectory-card.component'
import { TrajectoryCardPopoverPage } from './trajectory-card/trajectory-card-popover/trajectory-card-popover.page'
import { SharedUiModule } from '../shared-ui/shared-ui.module'
import { TrajectoryImportExportService } from '../shared-services/trajectory/trajectory-import-export.service'
import { DebugWindowFormatFileSizePipe } from '../debug-window/debug-window-file-size.pipe'

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
    DebugWindowComponent,
    DebugWindowFormatFileSizePipe,
    TrajectoryCardComponent,
    TrajectoryCardPopoverPage,
  ],
  providers: [TrajectoryImportExportService],
})
export class SelectTrajectoryPageModule {}
