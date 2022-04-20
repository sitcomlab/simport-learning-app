import { Injectable } from '@angular/core'
import { NotificationType } from './types'
import { Plugins } from '@capacitor/core'
import { Router } from '@angular/router'

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private router: Router) {
    this.checkPermission()

    // listen for notifications sent to unpause tracking
    Plugins.LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (performed) => {
        if (
          performed.actionId === 'tap' &&
          performed.notification.id ===
            NotificationType.unpauseTrackingNotification
        ) {
          this.router.navigate([`/tracking`])
        }
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
      console.log('scheduled notification at', fireDate.toString())
    })
  }

  removeScheduledUnpauseNotifications() {
    // TODO
  }
}
