import { Injectable } from '@angular/core'
import { NotificationType } from './types'
import { Plugins } from '@capacitor/core'

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor() {
    this.checkPermission()
    Plugins.LocalNotifications.addListener(
      'localNotificationReceived',
      (notification) => {
        console.log('a notification has been displayed')
        console.log(notification.id)
      }
    )
    Plugins.LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (notificationPerformed) => {
        console.log('a notification has been clicked on')
        console.log(notificationPerformed.notification.id)
      }
    )
  }

  private checkPermission() {
    Plugins.LocalNotifications.requestPermission().then(
      (permissionResponse) => {
        console.log(
          'notification permission granted:' + permissionResponse.granted
        )
      }
    )
  }

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

  notifyAtTime(
    type: NotificationType,
    title: string,
    text: string,
    fireDate: Date
  ) {
    Plugins.LocalNotifications.schedule({
      notifications: [
        {
          id: type,
          title,
          body: text,
          schedule: { at: new Date(fireDate.getTime()) },
        },
      ],
    }).then(() => {
      console.log('scheduled notification at date')
    })
  }
}
