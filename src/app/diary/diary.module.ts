import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { DiaryPageRoutingModule } from './diary-routing.module'

import { DiaryPage } from './diary.page'
import { SharedUiModule } from '../shared-ui/shared-ui.module'
import { EditComponent } from './edit/edit.component'
import { DetailComponent } from './detail/detail.component'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DiaryPageRoutingModule,
    SharedUiModule,
  ],
  declarations: [DiaryPage, EditComponent, DetailComponent],
})
export class DiaryPageModule {}
