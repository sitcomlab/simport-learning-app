import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { TrajectoryPage, TrajectoryPagePath } from './trajectory.page'

const routes: Routes = [
  {
    path: '',
    component: TrajectoryPage,
    children: [
      {
        path: TrajectoryPagePath.inferences,
        loadChildren: () =>
          import('./inferences/inferences.module').then(
            (m) => m.InferencesPageModule
          ),
      },
      {
        path: TrajectoryPagePath.map,
        loadChildren: () =>
          import('./map/map.module').then((m) => m.MapPageModule),
      },
      {
        path: TrajectoryPagePath.exploration,
        loadChildren: () =>
          import('./explore/explore.module').then((m) => m.ExplorePageModule),
      },
      {
        path: TrajectoryPagePath.inferenceFilter,
        loadChildren: () =>
          import('./inference-filter/inference-filter.module').then(
            (m) => m.InferenceFilterModule
          ),
      },
      {
        path: '',
        canActivate: [TrajectoryPage],
        redirectTo: TrajectoryPagePath.map,
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
