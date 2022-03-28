import { TestBed } from '@angular/core/testing'

import { InformedConsentService } from './informed-consent.service'

describe('InformedConsentService', () => {
  let service: InformedConsentService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(InformedConsentService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
