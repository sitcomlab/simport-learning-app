import { InferenceType } from '../shared-services/inferences/types'

export class Inference {
  constructor(
    public name: string,
    public type: InferenceType,
    public description: string,
    public trajectoryId: string,
    public lonLat: [number, number],
    public confidence?: number,
    public accuracy?: number
  ) {}

  static fromObject(val: any) {
    const {
      name,
      type,
      description,
      trajectoryId,
      lonLat,
      confidence,
      accuracy,
    } = val

    return new Inference(
      name,
      type,
      description,
      trajectoryId,
      lonLat,
      confidence,
      accuracy
    )
  }
}
