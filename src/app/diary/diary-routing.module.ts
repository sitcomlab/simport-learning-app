import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { DiaryDetailComponent } from './diary-detail/diary-detail.component'

import { DiaryPage } from './diary.page'
import { DiaryEditComponent } from './diary-edit/diary-edit.component'

const routes: Routes = [
  {
    path: '',
    component: DiaryPage,
  },
  {
    path: 'edit/:id',
    component: DiaryEditComponent,
  },
  {
    path: ':id',
    component: DiaryDetailComponent,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DiaryPageRoutingModule {}
