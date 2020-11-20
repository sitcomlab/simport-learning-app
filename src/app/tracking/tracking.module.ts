import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'

import { TrackingPageRoutingModule } from './tracking-routing.module'
import { TrackingPage } from './tracking.page'
import { SharedUiModule } from '../shared-ui/shared-ui.module'
import { NgxMapboxGLModule } from 'ngx-mapbox-gl'
import { environment } from 'src/environments/environment'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TrackingPageRoutingModule,
    SharedUiModule,
    NgxMapboxGLModule.withConfig({
      accessToken: environment.mapboxAccessToken, // Optional, can also be set per map (accessToken input of mgl-map)
    }),
  ],
  declarations: [TrackingPage],
})
export class TrackingPageModule {}
