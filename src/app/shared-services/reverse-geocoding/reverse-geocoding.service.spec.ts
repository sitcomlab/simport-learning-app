import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { SqliteService } from '../db/sqlite.service'
import { ReverseGeocodingService } from './reverse-geocoding.service'

describe('ReverseGeocodingService', () => {
  let service: ReverseGeocodingService

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SqliteService],
    })
    service = TestBed.inject(ReverseGeocodingService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
