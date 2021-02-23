import { TestBed } from '@angular/core/testing'

import { TrajectoryImportExportService } from './trajectory-import-export.service'

describe('TrajectoryImportExportService', () => {
  let service: TrajectoryImportExportService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(TrajectoryImportExportService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
