import { Injectable } from '@angular/core'
import { Trajectory } from '../model/trajectory'

@Injectable({
  providedIn: 'root',
})
export class TrajectoryService {
  private trajectories: Trajectory[] = [
    {
      id: 'bejing',
      name: 'Test',
      placename: 'Bejing',
      lonLats: [],
      timestamps: [],
    },
    {
      id: 'bejing',
      name: 'Test',
      placename: 'Münster',
      lonLats: [],
      timestamps: [],
    },
    {
      id: 'bejing',
      name: 'Test',
      placename: 'Bejing',
      lonLats: [
        [1, 1],
        [2, 2],
      ],
      timestamps: [
        new Date('2020-09-03T00:00:00Z'),
        new Date('2020-09-29T00:00:00Z'),
      ],
    },
  ]

  constructor() {}

  getAllTrajectories(): Trajectory[] {
    return this.trajectories
  }
}
