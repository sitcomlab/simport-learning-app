import { Injectable } from '@angular/core'
import { Trajectory } from '../model/trajectory'

@Injectable({
  providedIn: 'root',
})
export class TrajectoryService {
  private trajectories: Trajectory[] = [
    {
      id: 'bejing01',
      name: 'Test',
      placename: 'Bejing',
      coordinates: [],
      timestamps: [],
    },
    {
      id: 'muenster',
      name: 'Test',
      placename: 'Münster',
      coordinates: [
        [51.968989, 7.602684],
        [51.967793, 7.610033],
      ],
      timestamps: [],
    },
    {
      id: 'bejing02',
      name: 'Test',
      placename: 'Bejing',
      coordinates: [
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

  getTrajectory(id: string): Trajectory {
    return this.trajectories.filter((t) => t.id === id)[0]
  }
}
