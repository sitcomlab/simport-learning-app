import { AllInferences } from '../shared-services/inferences/engine/definitions'
import { InferenceType } from '../shared-services/inferences/engine/types'
import * as polyline from '@mapbox/polyline'
import { ReverseGeocoding } from './reverse-geocoding'

export class Inference {
  public geocoding?: ReverseGeocoding

  constructor(
    public name: string,
    public type: InferenceType,
    public description: string,
    public trajectoryId: string,
    public latLng: [number, number],
    public coordinates: [number, number][],
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

  get hasAddress(): boolean {
    return this.geocoding !== undefined
  }

  get addressDisplayName(): string {
    if (this.geocoding && this.geocoding.address) {
      const name = this.geocoding.name || ''
      const road = this.geocoding.address.road || ''
      const houseNumber = this.geocoding.address.houseNumber || ''
      const location =
        this.geocoding.address.town ||
        this.geocoding.address.village ||
        this.geocoding.address.country ||
        ''
      return `${name.length > 0 ? name + ' ' : name} ${road}${
        houseNumber.length > 0 ? ' ' + houseNumber : houseNumber
      } (${location})`
    }
    return `${this.latLng[0].toFixed(2)}, ${this.latLng[1].toFixed(2)}`
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
