import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { LicensesPageRoutingModule } from './licenses-routing.module'

import { LicensesPage } from './licenses.page'

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, LicensesPageRoutingModule],
  declarations: [LicensesPage],
})
export class LicensesPageModule {}
