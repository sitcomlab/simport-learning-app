import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { TrajectoryPage } from './trajectory.page'

export enum TrajectoryPagePath {
  Inferences = 'trajectory-inferences',
  Map = 'trajectory-map',
  Exploration = 'trajectory-exploration',
  InferenceFilter = 'trajectory-inference-filter',
}

const routes: Routes = [
  {
    path: '',
    component: TrajectoryPage,
    children: [
      {
        path: TrajectoryPagePath.Inferences,
        loadChildren: () =>
          import('./inferences/inferences.module').then(
            (m) => m.InferencesPageModule
          ),
      },
      {
        path: TrajectoryPagePath.Map,
        loadChildren: () =>
          import('./map/map.module').then((m) => m.MapPageModule),
      },
      {
        path: TrajectoryPagePath.Exploration,
        loadChildren: () =>
          import('./explore/explore.module').then((m) => m.ExplorePageModule),
      },
      {
        path: TrajectoryPagePath.InferenceFilter,
        loadChildren: () =>
          import('./inference-filter/inference-filter.module').then(
            (m) => m.InferenceFilterModule
          ),
      },
      {
        path: '',
        canActivate: [TrajectoryPage],
        redirectTo: TrajectoryPagePath.Map,
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
