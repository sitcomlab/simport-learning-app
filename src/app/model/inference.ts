import { AllInferences } from '../shared-services/inferences/engine/definitions'
import { InferenceType } from '../shared-services/inferences/engine/types'
import * as polyline from '@mapbox/polyline'
import { ReverseGeocoding } from './reverse-geocoding'
import { TranslateService } from '@ngx-translate/core'

export class Inference {
  public geocoding?: ReverseGeocoding

  constructor(
    public id: string,
    public name: string,
    public type: InferenceType,
    public description: string,
    public trajectoryId: string,
    public latLng: [number, number],
    public coordinates: [number, number][],
    public confidence?: number,
    public accuracy?: number,
    // onSiteTimes are not saved in the database, therefore not present in fromObject()
    public onSiteTimes?: [Date, Date][]
  ) {}

  static fromObject(val: any): Inference {
    const {
      id,
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
      id,
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

  get hasGeocoding(): boolean {
    return this.geocoding !== undefined
  }

  get addressDisplayName(): string {
    if (this.hasGeocoding) {
      const name = this.geocoding.name ? `${this.geocoding.name}, ` : ''
      const road = this.geocoding.road ? `${this.geocoding.road} ` : ''
      const houseNumber = this.geocoding.houseNumber
        ? this.geocoding.houseNumber
        : ''
      const location =
        this.geocoding.city ||
        this.geocoding.town ||
        this.geocoding.village ||
        this.geocoding.country ||
        ''
      const locationString = location.length > 0 ? ` (${location})` : location

      const displayName = `${name}${road}${houseNumber}${locationString}`
      if (displayName.trim().length > 0) return displayName
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

export abstract class InferenceConfidenceThresholds {
  public static high = 0.6
  public static medium = 0.3
  public static low = 0.05

  public static getQualitativeConfidence(confidenceValue: number): string {
    if (confidenceValue >= this.high) return 'high'
    else if (confidenceValue >= this.medium) return 'medium'
    else if (confidenceValue >= this.low) return 'low'
  }
}
