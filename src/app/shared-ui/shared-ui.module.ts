import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from '@ionic/angular'
import { TranslateModule } from '@ngx-translate/core'
import { ItemCardComponent } from './item-card/item-card.component'

@NgModule({
  declarations: [ItemCardComponent],
  imports: [CommonModule, IonicModule],
  exports: [ItemCardComponent, TranslateModule],
})
export class SharedUiModule {}
