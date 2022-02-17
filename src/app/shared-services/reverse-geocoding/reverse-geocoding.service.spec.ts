import { TestBed } from '@angular/core/testing'

import { APP_TEST_IMPORTS } from 'src/app/app.declarations'
import { SqliteService } from '../db/sqlite.service'
import { FeatureFlagService } from '../feature-flag/feature-flag.service'
import { ReverseGeocodingService } from './reverse-geocoding.service'

describe('ReverseGeocodingService', () => {
  let service: ReverseGeocodingService

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: APP_TEST_IMPORTS,
      providers: [SqliteService, FeatureFlagService],
    })
    service = TestBed.inject(ReverseGeocodingService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
