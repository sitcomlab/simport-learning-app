import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    // FIXME: this should route depending wether we have persisted an previous selected trajectory to that one,
    // or to select-trajectory..
    path: '',
    redirectTo: 'select-trajectory',
    pathMatch: 'full',
  },
  {
    path: 'trajectory/:id',
    loadChildren: () => import('./trajectory/trajectory.module').then( m => m.TrajectoryPageModule)
  },
  {
    path: 'select-trajectory',
    loadChildren: () => import('./select-trajectory/select-trajectory.module').then( m => m.SelectTrajectoryPageModule)
  },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
      useHash: true,
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
