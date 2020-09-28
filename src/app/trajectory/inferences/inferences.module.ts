import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InferencesPageRoutingModule } from './inferences-routing.module';

import { InferencesPage } from './inferences.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InferencesPageRoutingModule
  ],
  declarations: [InferencesPage]
})
export class InferencesPageModule {}
