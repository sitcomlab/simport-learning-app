import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Trajectory } from 'src/app/model/trajectory';

@Component({
  selector: 'app-trajectory-selector',
  templateUrl: './trajectory-selector.component.html',
  styleUrls: ['./trajectory-selector.component.scss'],
})
export class TrajectorySelectorComponent implements OnInit {
  trajectories: Trajectory[] = [
    { id: 'bejing', name: 'Test', placename: 'Bejing', lonLats: [], timestamps: [] },
    { id: 'bejing', name: 'Test', placename: 'Münster', lonLats: [], timestamps: [] },
    { id: 'bejing', name: 'Test', placename: 'Bejing', lonLats: [[1,1], [2,2]], timestamps: [new Date('2020-09-03T00:00:00Z'), new Date('2020-09-29T00:00:00Z')] },
  ]

  constructor(private modalCtrl: ModalController) { }

  ngOnInit() {}

  select(id: string) {
    this.modalCtrl.dismiss(id)
  }

}
