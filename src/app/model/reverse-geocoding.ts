/* eslint-disable @typescript-eslint/naming-convention */

enum GeocodingIcon {
  shop = 'basket',
  education = 'school',
  restaurant = 'restaurant',
  bar = 'beer',
  cafe = 'cafe',
  icecream = 'ice-cream',
  kindergarten = 'balloon',
  sports = 'tennisball',
  medical = 'bandages',
  busstation = 'bus',
  trainstation = 'train',
  bank = 'cash',
  house = 'home',
}

const geocodingIconPairings = new Map([
  [GeocodingIcon.shop, ['shop']],
  [
    GeocodingIcon.education,
    [
      'school',
      'college',
      'university',
      'driving_school',
      'language_school',
      'library',
      'research_institute',
    ],
  ],
  [GeocodingIcon.restaurant, ['restaurant', 'food_court', 'fast_food']],
  [GeocodingIcon.bar, ['bar', 'pub', 'biergarten']],
  [GeocodingIcon.cafe, ['cafe']],
  [GeocodingIcon.icecream, ['ice_cream']],
  [GeocodingIcon.kindergarten, ['kindergarten', 'playground']],
  [
    GeocodingIcon.sports,
    [
      'fitness_station',
      'fitness_centre',
      'golf_course',
      'miniature_golf',
      'sports_centre',
      'sports_hall',
    ],
  ],
  [
    GeocodingIcon.medical,
    ['clinic', 'hospital', 'doctors', 'dentist', 'pharmacy', 'nursing_home'],
  ],
  [GeocodingIcon.busstation, ['']],
  [GeocodingIcon.trainstation, ['']],
  [GeocodingIcon.bank, ['bank', 'atm', 'bureau_de_change']],
  [GeocodingIcon.house, ['house', 'detached']],
])

export class ReverseGeocodingIcon {
  private static fallbackIcon = 'pin'

  static getGeocodingIcon(geocoding: ReverseGeocoding): string {
    const typeIcon = [...geocodingIconPairings.keys()].find(
      (key) => geocodingIconPairings.get(key)?.includes(geocoding.type) ?? false
    )
    if (typeIcon) {
      return typeIcon
    }
    const categoryIcon = [...geocodingIconPairings.keys()].find(
      (key) =>
        geocodingIconPairings.get(key)?.includes(geocoding.category) ?? false
    )
    return categoryIcon ?? ReverseGeocodingIcon.fallbackIcon
  }
}

export class ReverseGeocoding {
  constructor(
    public originLatLng: [number, number],
    public codedLatLon: [number, number],
    public name?: string,
    public displayName?: string,
    public category?: string,
    public type?: string,
    public road?: string,
    public houseNumber?: string,
    public postcode?: string,
    public village?: string,
    public town?: string,
    public city?: string,
    public hamlet?: string,
    public stateDistrict?: string,
    public state?: string,
    public county?: string,
    public country?: string,
    public countryCode?: string
  ) {}

  static fromApiObject(
    val: any,
    originLatLng: [number, number]
  ): ReverseGeocoding {
    const {
      lat,
      lon,
      name,
      display_name,
      category,
      type,
      address: {
        road,
        village,
        town,
        city,
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
      originLatLng,
      [Number(lat), Number(lon)],
      name,
      display_name,
      category,
      type,
      road,
      house_number,
      postcode,
      town,
      village,
      city,
      hamlet,
      state_district,
      state,
      county,
      country,
      country_code
    )
  }
}
