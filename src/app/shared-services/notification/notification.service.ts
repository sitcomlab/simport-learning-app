import { Injectable } from '@angular/core'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'
import { NotificationType } from './types'

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private localNotifications: LocalNotifications) {}

  notify(type: NotificationType, title: string, text: string) {
    this.localNotifications.schedule({
      id: type,
      title,
      text,
    })
  }
}
