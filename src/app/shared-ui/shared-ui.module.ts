import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ItemCardComponent } from './item-card/item-card.component'

@NgModule({
  declarations: [ItemCardComponent],
  imports: [CommonModule],
  exports: [ItemCardComponent],
})
export class SharedUiModule {}
