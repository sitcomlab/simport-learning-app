import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { DetailComponent } from './detail/detail.component'

import { DiaryPage } from './diary.page'
import { EditComponent } from './edit/edit.component'

const routes: Routes = [
  {
    path: '',
    component: DiaryPage,
  },
  {
    path: 'edit/:id',
    component: EditComponent,
  },
  {
    path: ':id',
    component: DetailComponent,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DiaryPageRoutingModule {}
