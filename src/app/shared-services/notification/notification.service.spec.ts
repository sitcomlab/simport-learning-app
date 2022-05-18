import { TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'

import { NotificationService } from './notification.service'

describe('NotificationService', () => {
  let service: NotificationService
  const mockRouter = {
    navigate: jasmine.createSpy('navigate'),
  }
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: mockRouter }],
    })
    service = TestBed.inject(NotificationService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
