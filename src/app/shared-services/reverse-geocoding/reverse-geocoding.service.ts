import { Injectable } from '@angular/core'
import { Point } from 'src/app/model/trajectory'
import { point } from '@turf/helpers'
import buffer from '@turf/buffer'
import bbox from '@turf/bbox'
import { randomPoint } from '@turf/random'
import transformTranslate from '@turf/transform-translate'

@Injectable({
  providedIn: 'root',
})
export class ReverseGeocodingService {
  static readonly NUMBER_OF_DUMMY_LOCATIONS = 10
  static readonly RADIUS_FOR_DUMMY_LOCATIONS = 5000
  static readonly REVERSE_GEOCODING_URL =
    'https://nominatim.openstreetmap.org/reverse'

  constructor() {}

  async reverseGeocode(location: Point): Promise<any> {
    const actualRequest = new Promise(async (resolve, _) => {
      const url = this.createReverseGeocodingRequestInfo(
        location.latLng[1],
        location.latLng[0]
      )
      const req = await fetch(url)
      resolve(await req.json())
    })
    // create geocoding requests for actual point
    // and place it at a random position in the requests array
    const actualRequestIndex = Math.floor(
      Math.random() * ReverseGeocodingService.NUMBER_OF_DUMMY_LOCATIONS
    )
    const requests = this.createDummyRequests(
      location,
      ReverseGeocodingService.NUMBER_OF_DUMMY_LOCATIONS,
      ReverseGeocodingService.RADIUS_FOR_DUMMY_LOCATIONS
    )
    requests.splice(actualRequestIndex, 0, actualRequest)

    // fire the requests and retreive data
    const data = await Promise.all(requests)

    return data[actualRequestIndex]
  }

  private createDummyRequests(
    location: Point,
    numberOfRequests: number,
    radiusForDummyRequestsInMeters: number
  ) {
    // calculate buffer around requested location
    const positionBuffer = buffer(
      point([location.latLng[1], location.latLng[0]]),
      ReverseGeocodingService.RADIUS_FOR_DUMMY_LOCATIONS,
      {
        units: 'meters',
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
        units: 'meters',
      }
    )

    // create bbox from buffer
    const posBbox = bbox(translatedBuffer)

    // generate random points in bbox
    const randomPoints = randomPoint(numberOfRequests, { bbox: posBbox })
    const requests = randomPoints.features.map(async (p) => {
      const url = this.createReverseGeocodingRequestInfo(
        p.geometry.coordinates[1],
        p.geometry.coordinates[0]
      )
      const req = await fetch(url)
      return await req.json()
    })

    return requests
  }

  private createReverseGeocodingRequestInfo(
    lat: number,
    lon: number
  ): RequestInfo {
    return `${ReverseGeocodingService.REVERSE_GEOCODING_URL}?lat=${lat}&lon=${lon}&format=geojson`
  }
}
