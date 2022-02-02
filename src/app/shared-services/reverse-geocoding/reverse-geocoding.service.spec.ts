import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { SqliteService } from '../db/sqlite.service'
import { FeatureFlagService } from '../feature-flag/feature-flag.service'
import { ReverseGeocodingService } from './reverse-geocoding.service'

describe('ReverseGeocodingService', () => {
  let service: ReverseGeocodingService

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SqliteService, FeatureFlagService],
    })
    service = TestBed.inject(ReverseGeocodingService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
