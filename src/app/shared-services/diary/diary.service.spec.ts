import { TestBed } from '@angular/core/testing'
import { SqliteService } from '../db/sqlite.service'

import { DiaryService } from './diary.service'

describe('DiaryService', () => {
  let service: DiaryService

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SqliteService],
    })
    service = TestBed.inject(DiaryService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
