import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { SettingsPageRoutingModule } from './settings-routing.module'

import { SettingsPage } from './settings.page'
import { SharedUiModule } from '../shared-ui/shared-ui.module'
import { ImprintPage } from './imprint/imprint.page'
import { OpenSourcesPage } from './open-sources/open-sources.page'
import { PrivacyPolicyPage } from './privacy-policy/privacy-policy.page'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SettingsPageRoutingModule,
    SharedUiModule,
  ],
  declarations: [SettingsPage, ImprintPage, OpenSourcesPage, PrivacyPolicyPage],
})
export class SettingsPageModule {}
