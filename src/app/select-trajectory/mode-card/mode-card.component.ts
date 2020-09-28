import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-mode-card',
  templateUrl: './mode-card.component.html',
  styleUrls: ['./mode-card.component.scss'],
})
export class ModeCardComponent implements OnInit {
  @Input() icon: string
  @Input() title: string
  @Input() subtitle: string


  constructor() { }

  ngOnInit() {}

}
