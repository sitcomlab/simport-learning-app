export class ReverseGeocoding {
  constructor(
    public lat: number,
    public lon: number,
    public name?: string,
    public type?: string,
    public displayName?: string,
    public address?: {
      road?: string
      village?: string
      town?: string
      stateDistrict?: string
      state?: string
      postcode?: string
      county?: string
      country?: string
      countryCode?: string
      houseNumber?: string
      hamlet?: string
    }
  ) {}

  static fromObject(val: any): ReverseGeocoding {
    const {
      lat,
      lon,
      name,
      type,
      display_name,
      address: {
        road,
        village,
        town,
        state_district,
        state,
        postcode,
        county,
        country,
        country_code,
        house_number,
        hamlet,
      },
    } = val

    return new ReverseGeocoding(
      Number(lat),
      Number(lon),
      name,
      type,
      display_name,
      {
        road,
        village,
        town,
        stateDistrict: state_district,
        state,
        postcode,
        county,
        country,
        countryCode: country_code,
        houseNumber: house_number,
        hamlet,
      }
    )
  }

  get latLng(): [number, number] {
    return [this.lat, this.lon]
  }
}
