import { Injectable } from '@angular/core'
import { Capacitor } from '@capacitor/core'
import BackgroundFetch from 'cordova-plugin-background-fetch'
import { BehaviorSubject } from 'rxjs'

type BackgroundFunction = {
  taskId: string
  run: (callback: Promise<void>) => Promise<void>
}

export enum BackgroundState {
  idle,
  foreground,
  background,
}

@Injectable({ providedIn: 'root' }) // Singleton
export class BackgroundService {
  private currentBackgroundState: BehaviorSubject<BackgroundState> =
    new BehaviorSubject<BackgroundState>(BackgroundState.idle)

  private functions: BackgroundFunction[] = []

  private fetchInterval = 60

  constructor() {
    this.initBackgroundFetch()
  }

  /**
   * Initialises the background-fetch events.
   * This is periodically run by the OS and additionally serves as a callback for custom scheduled fetches.
   */
  async initBackgroundFetch() {
    if (!Capacitor.isNative) return
    await BackgroundFetch.configure(
      {
        /**
         * The minimum interval in minutes to execute background fetch events.
         * Note: Background-fetch events will never occur at a frequency higher than every 15 minutes.
         * OS use a closed algorithm to adjust the frequency of fetch events, presumably based upon usage patterns of the app.
         * Therefore the actual fetch-interval is fully up to the OS,
         * fetch events can occur significantly less often than the configured minimumFetchInterval.
         */
        minimumFetchInterval: this.fetchInterval,
        forceAlarmManager: true, // increases reliabilty for Android
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
      },
      async (taskId) => {
        console.log('[BackgroundFetch] event received: ', taskId)

        // OS signalled that background-processing-time is available
        this.currentBackgroundState.next(BackgroundState.background)

        // run background functions
        this.functions.forEach(async (f) => await f.run(undefined))

        BackgroundFetch.finish(taskId)
      },
      async (taskId) => {
        console.log('[BackgroundFetch] TIMEOUT: ', taskId)

        // OS signalled that the time for background-processing has expired
        this.currentBackgroundState.next(BackgroundState.idle)
        BackgroundFetch.finish(taskId)
      }
    )
  }

  addBackgroundFunction(
    taskId: string,
    backgroundFunction: (callback: Promise<void>) => Promise<void>
  ) {
    this.functions.push({
      taskId,
      run: backgroundFunction,
    })
  }

  get backgroundState(): BackgroundState {
    return this.currentBackgroundState.value
  }

  set backgroundState(nextBackgroundState: BackgroundState) {
    this.currentBackgroundState.next(nextBackgroundState)
  }
}
