import { Injectable } from '@angular/core'
import { NotificationType } from './types'
import { Plugins } from '@capacitor/core'

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor() {}

  notify(type: NotificationType, title: string, text: string) {
    Plugins.LocalNotifications.schedule({
      notifications: [
        {
          id: type,
          title,
          body: text,
        },
      ],
    })
  }
}
