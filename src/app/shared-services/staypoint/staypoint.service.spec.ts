import { TestBed } from '@angular/core/testing'

import { StaypointService } from './staypoint.service'

describe('StaypointService', () => {
  let service: StaypointService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(StaypointService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
