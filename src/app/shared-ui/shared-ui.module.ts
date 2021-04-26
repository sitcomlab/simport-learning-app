import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from '@ionic/angular'
import { ItemCardComponent } from './item-card/item-card.component'

@NgModule({
  declarations: [ItemCardComponent],
  imports: [CommonModule, IonicModule],
  exports: [ItemCardComponent],
})
export class SharedUiModule {}
