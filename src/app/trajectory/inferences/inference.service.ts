import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root',
})
export class InferenceService {
  private inferences: Inference[] = [
    {
      name: 'Home',
      description: 'We do now know where your home is.',
      trajectoryId: 'beijing',
      location: [51.968446, 7.60549],
      accuracy: 50,
    },
    {
      name: 'Workplace',
      description: 'We know where you work.',
      trajectoryId: 'beijing',
    },
  ]
  constructor() {}

  getInferences(trajectoryId?: string) {
    return this.inferences
  }
}
