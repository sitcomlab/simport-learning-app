import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SelectTrajectoryPageRoutingModule } from './select-trajectory-routing.module';

import { SelectTrajectoryPage } from './select-trajectory.page';
import { ModeCardComponent } from './mode-card/mode-card.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SelectTrajectoryPageRoutingModule,
  ],
  declarations: [SelectTrajectoryPage, ModeCardComponent]
})
export class SelectTrajectoryPageModule {}
