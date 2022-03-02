import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { ImprintPage } from './imprint/imprint.page'
import { OpenSourcesPage } from './open-sources/open-sources.page'
import { PrivacyPolicyPage } from './privacy-policy/privacy-policy.page'

import { SettingsPage } from './settings.page'

const routes: Routes = [
  {
    path: '',
    component: SettingsPage,
  },
  {
    path: 'imprint',
    component: ImprintPage,
  },
  {
    path: 'oss-licenses',
    component: OpenSourcesPage,
  },
  {
    path: 'privacy-policy',
    component: PrivacyPolicyPage,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsPageRoutingModule {}
