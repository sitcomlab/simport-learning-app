import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { InferencesPageRoutingModule } from './inferences-routing.module'

import { InferencesPage } from './inferences.page'
import { SelectTrajectoryPageModule } from 'src/app/select-trajectory/select-trajectory.module'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InferencesPageRoutingModule,
    SelectTrajectoryPageModule,
  ],
  declarations: [InferencesPage],
})
export class InferencesPageModule {}
