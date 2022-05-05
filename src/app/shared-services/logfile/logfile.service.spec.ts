import { TestBed } from '@angular/core/testing'
import { APP_TEST_IMPORTS } from 'src/app/app.declarations'
import { SqliteService } from '../db/sqlite.service'
import { TrajectoryService } from '../trajectory/trajectory.service'

import { LogfileService } from './logfile.service'

describe('LogfileService', () => {
  let service: LogfileService

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: APP_TEST_IMPORTS,
      providers: [SqliteService, TrajectoryService],
    })
    service = TestBed.inject(LogfileService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
