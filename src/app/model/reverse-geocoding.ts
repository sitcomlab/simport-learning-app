export class ReverseGeocoding {
  constructor(
    public lat: number,
    public lon: number,
    public address: string,
    public type?: string
  ) {}

  get latLng(): [number, number] {
    return [this.lat, this.lon]
  }
}
