import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SelectTrajectoryPage } from './select-trajectory.page';

const routes: Routes = [
  {
    path: '',
    component: SelectTrajectoryPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SelectTrajectoryPageRoutingModule {}
