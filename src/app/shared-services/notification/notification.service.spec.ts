import { TestBed } from '@angular/core/testing'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'

import { NotificationService } from './notification.service'

describe('NotificationService', () => {
  let service: NotificationService

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [LocalNotifications] })
    service = TestBed.inject(NotificationService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
