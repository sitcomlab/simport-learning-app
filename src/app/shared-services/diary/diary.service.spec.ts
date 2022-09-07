import { TestBed } from '@angular/core/testing'
import { APP_TEST_IMPORTS } from 'src/app/app.declarations'
import { SqliteService } from '../db/sqlite.service'
import { TrajectoryService } from '../trajectory/trajectory.service'

import { DiaryService } from './diary.service'

describe('DiaryService', () => {
  let service: DiaryService

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: APP_TEST_IMPORTS,
      providers: [TrajectoryService, SqliteService],
    })
    service = TestBed.inject(DiaryService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
