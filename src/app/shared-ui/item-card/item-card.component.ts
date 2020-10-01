import { Component, Input, OnInit } from '@angular/core'

@Component({
  selector: 'app-item-card',
  templateUrl: './item-card.component.html',
  styleUrls: ['./item-card.component.scss'],
})
export class ItemCardComponent implements OnInit {
  @Input() icon: string
  @Input() title: string
  @Input() subtitle: string

  constructor() {}

  ngOnInit() {}
}
