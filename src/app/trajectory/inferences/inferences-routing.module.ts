import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

import { InferencesPage } from './inferences.page'

const routes: Routes = [
  {
    path: '',
    component: InferencesPage,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InferencesPageRoutingModule {}
