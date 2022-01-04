import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { DiaryPageRoutingModule } from './diary-routing.module'

import { DiaryPage } from './diary.page'
import { SharedUiModule } from '../shared-ui/shared-ui.module'
import { DiaryEditComponent } from './diary-edit/diary-edit.component'
import { DiaryDetailComponent } from './diary-detail/diary-detail.component'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DiaryPageRoutingModule,
    SharedUiModule,
  ],
  declarations: [DiaryPage, DiaryEditComponent, DiaryDetailComponent],
})
export class DiaryPageModule {}
