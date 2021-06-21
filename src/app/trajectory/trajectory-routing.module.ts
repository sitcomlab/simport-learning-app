import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { TrajectoryPage } from './trajectory.page'

export enum TrajectoryPagePath {
  INFERENCES = 'inferences',
  MAP = 'map',
  EXPLORE = 'explore',
  INFERENCE_FILTER = 'inference-filter',
}

const routes: Routes = [
  {
    path: '',
    component: TrajectoryPage,
    children: [
      {
        path: TrajectoryPagePath.INFERENCES,
        loadChildren: () =>
          import('./inferences/inferences.module').then(
            (m) => m.InferencesPageModule
          ),
      },
      {
        path: TrajectoryPagePath.MAP,
        loadChildren: () =>
          import('./map/map.module').then((m) => m.MapPageModule),
      },
      {
        path: TrajectoryPagePath.EXPLORE,
        loadChildren: () =>
          import('./explore/explore.module').then((m) => m.ExplorePageModule),
      },
      {
        path: TrajectoryPagePath.INFERENCE_FILTER,
        loadChildren: () =>
          import('./inference-filter/inference-filter.module').then(
            (m) => m.InferenceFilterModule
          ),
      },
      {
        path: '',
        redirectTo: TrajectoryPagePath.INFERENCES,
        pathMatch: 'full',
      },
    ],
    // TODO: setup canActivate guard, to ensure valid :id param is set.
    // TODO: setup canLeave guard, to ask if background tracking should be stopped?
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TrajectoryPageRoutingModule {}
