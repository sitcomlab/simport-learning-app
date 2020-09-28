import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TrajectoryPage } from './trajectory.page';

const routes: Routes = [
  {
    path: '',
    component: TrajectoryPage,
    children: [
      {
        path: 'inferences',
        loadChildren: () => import('./inferences/inferences.module').then( m => m.InferencesPageModule)
      },
      {
        path: 'map',
        loadChildren: () => import('./map/map.module').then( m => m.MapPageModule)
      },
      {
        path: 'explore',
        loadChildren: () => import('./explore/explore.module').then( m => m.ExplorePageModule)
      },
      {
        path: '',
        redirectTo: 'inferences',
        pathMatch: 'full',
      },
    ],
    // TODO: setup canActivate guard, to ensure valid :id param is set.
    // TODO: setup canLeave guard, to ask if background tracking should be stopped?
  },
  {
    path: 'explore',
    loadChildren: () => import('./explore/explore.module').then( m => m.ExplorePageModule)
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TrajectoryPageRoutingModule {}
