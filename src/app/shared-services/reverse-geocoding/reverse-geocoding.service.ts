import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { point } from '@turf/helpers'
import buffer from '@turf/buffer'
import bbox from '@turf/bbox'
import { randomPoint } from '@turf/random'
import transformTranslate from '@turf/transform-translate'
import { delay } from 'rxjs/operators'
import { SqliteService } from '../db/sqlite.service'
import { ReverseGeocoding } from 'src/app/model/reverse-geocoding'

type GeocodingJSON = {
  lat?: number
  lon?: number
  display_name?: string
  type?: string
  address?: {
    road?: string
    village?: string
    state_district?: string
    state?: string
    postcode?: string
    county?: string
    country_code?: string
  }
}

@Injectable({
  providedIn: 'root',
})
export class ReverseGeocodingService {
  private static readonly NUMBER_OF_DUMMY_LOCATIONS = 5
  private static readonly RADIUS_FOR_DUMMY_LOCATIONS = 5000
  private static readonly RADIUS_UNIT = 'meters'
  private static readonly REVERSE_GEOCODING_URL =
    'https://nominatim.openstreetmap.org/reverse'
  private static readonly REVERSE_GEOCODE_FORMAT = 'jsonv2'
  // limited to 'an absolute maximum of 1 request per second'
  // see https://operations.osmfoundation.org/policies/nominatim/
  private static readonly REVERSE_GEOCODE_DELAY_MS = 1500

  constructor(private dbService: SqliteService, private http: HttpClient) {}

  async reverseGeocodeMultiple(
    latLngArray: [number, number][]
  ): Promise<ReverseGeocoding[]> {
    const geocodingResults: ReverseGeocoding[] = []
    latLngArray.forEach(async (latLng) => {
      const previousCoding = await this.getPersistedReverseGeocoding(latLng)
      if (previousCoding) {
        geocodingResults.push(previousCoding)
      } else {
        const coding = await this.reverseGeocode(latLng, true)
        geocodingResults.push(coding)
        delay(ReverseGeocodingService.REVERSE_GEOCODE_DELAY_MS)
      }
    })
    return geocodingResults
  }

  private async reverseGeocode(
    latLng: [number, number],
    skipPersistenceCheck: boolean = false
  ): Promise<any> {
    if (!skipPersistenceCheck) {
      const previousCoding = await this.getPersistedReverseGeocoding(latLng)
      if (previousCoding) {
        return previousCoding
      }
    }
    const actualRequest = this.createReverseGeocodingRequestUrl(...latLng)

    // create geocoding requests for actual point
    // and place it at a random position in the requests array
    const actualRequestIndex = Math.floor(
      Math.random() * ReverseGeocodingService.NUMBER_OF_DUMMY_LOCATIONS
    )
    const requests = this.createDummyRequests(
      latLng,
      ReverseGeocodingService.NUMBER_OF_DUMMY_LOCATIONS,
      ReverseGeocodingService.RADIUS_FOR_DUMMY_LOCATIONS
    )
    requests.splice(actualRequestIndex, 0, actualRequest)

    requests.forEach((r, i) => {
      const delayTime =
        (i + 1) * ReverseGeocodingService.REVERSE_GEOCODE_DELAY_MS
      this.http
        .get<any>(r, {})
        .pipe(delay(delayTime))
        .subscribe((o) => {
          const result = o as GeocodingJSON
          // TODO
        })
    })

    // TODO: persist geocoding
    // const geocoding = new ReverseGeocoding(...latLng, address, type)
    // this.dbService.upsertReverseGeocoding(geocoding)
  }

  private createDummyRequests(
    latLng: [number, number],
    numberOfRequests: number,
    radiusForDummyRequestsInMeters: number
  ) {
    // calculate buffer around requested location
    const positionBuffer = buffer(
      point([latLng[1], latLng[0]]),
      ReverseGeocodingService.RADIUS_FOR_DUMMY_LOCATIONS,
      {
        units: ReverseGeocodingService.RADIUS_UNIT,
      }
    )

    // translating buffer to random distance and direction
    // + 0.2 so that there is always some offset
    const randomDistance = Math.floor(
      (Math.random() + 0.2) * radiusForDummyRequestsInMeters
    )
    const randomDirection = Math.floor(Math.random() * 360)
    const translatedBuffer = transformTranslate(
      positionBuffer,
      randomDistance,
      randomDirection,
      {
        units: ReverseGeocodingService.RADIUS_UNIT,
      }
    )

    // create bbox from buffer
    const posBbox = bbox(translatedBuffer)

    // generate random points in bbox
    const randomPoints = randomPoint(numberOfRequests, { bbox: posBbox })
    const requests = randomPoints.features.map((p) => {
      const request = this.createReverseGeocodingRequestUrl(
        p.geometry.coordinates[1],
        p.geometry.coordinates[0]
      )
      return request
    })

    return requests
  }

  private createReverseGeocodingRequestUrl(lat: number, lon: number): string {
    return `${ReverseGeocodingService.REVERSE_GEOCODING_URL}?lat=${lat}&lon=${lon}&format=${ReverseGeocodingService.REVERSE_GEOCODE_FORMAT}`
  }

  private async getPersistedReverseGeocoding(
    latLng: [number, number]
  ): Promise<ReverseGeocoding> {
    return await this.dbService.getReverseGeocoding(latLng)
  }
}
