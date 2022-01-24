import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

import { OpenSourcesPage } from './open-sources.page'

const routes: Routes = [
  {
    path: '',
    component: OpenSourcesPage,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OpenSourcesPageRoutingModule {}
