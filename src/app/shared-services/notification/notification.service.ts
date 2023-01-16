import { Injectable } from '@angular/core'
import { NotificationType } from './types'
import { Router } from '@angular/router'
import {
  CancelOptions,
  LocalNotifications,
} from '@capacitor/local-notifications'

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private router: Router) {
    this.checkPermission()

    // listen for notifications sent to unpause tracking
    LocalNotifications.addListener(
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

  notify(type: NotificationType, title: string, text: string) {
    LocalNotifications.schedule({
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
    LocalNotifications.schedule({
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

  async removeScheduledUnpauseNotifications() {
    const pendingUnpauseNotifications: CancelOptions = {
      notifications: [
        {
          id: NotificationType.unpauseTrackingNotification,
        },
      ],
    }
    await LocalNotifications.cancel(pendingUnpauseNotifications)
  }

  private checkPermission() {
    LocalNotifications.requestPermissions().then((permissionResponse) => {
      console.log('notification permission granted:' + permissionResponse)
    })
  }
}
