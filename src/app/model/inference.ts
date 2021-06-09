import { AllInferences } from '../shared-services/inferences/engine/definitions'
import { InferenceType } from '../shared-services/inferences/engine/types'
import * as polyline from '@mapbox/polyline'

export class Inference {
  constructor(
    public name: string,
    public type: InferenceType,
    public description: string,
    public trajectoryId: string,
    public latLng: [number, number],
    public coordinates?: [number, number][],
    public confidence?: number,
    public accuracy?: number
  ) {}

  static fromObject(val: any): Inference {
    const {
      name,
      type,
      description,
      trajectory,
      lat,
      lon,
      coordinates,
      confidence,
      accuracy,
    } = val

    return new Inference(
      name,
      type,
      description,
      trajectory,
      [lat, lon],
      polyline.decode(coordinates) as [number, number][],
      confidence,
      accuracy
    )
  }

  get coordinatesAsPolyline(): string {
    return polyline.encode(this.coordinates)
  }

  get icon(): string {
    return AllInferences[this.type].icon
  }

  get outlinedIcon(): string {
    return AllInferences[this.type].outlinedIcon
  }
}
