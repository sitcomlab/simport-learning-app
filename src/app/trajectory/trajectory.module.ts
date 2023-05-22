import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { TrajectoryPageRoutingModule } from './trajectory-routing.module'

import { TrajectoryPage } from './trajectory.page'
import { InferenceFilterModule } from './inference-filter/inference-filter.module'
import { InferenceModalModule } from './inference-modal/inference-modal.module'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InferenceFilterModule,
    InferenceModalModule,
    TrajectoryPageRoutingModule,
  ],
  declarations: [TrajectoryPage],
})
export class TrajectoryPageModule {}
