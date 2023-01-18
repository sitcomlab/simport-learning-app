/* eslint-disable @typescript-eslint/member-ordering */
import { BehaviorSubject } from 'rxjs'
import { Capacitor, Plugins } from '@capacitor/core'
import { BackgroundFetch } from '@transistorsoft/capacitor-background-fetch'
import { BackgroundService, BackgroundState } from './background.service'
import { App } from '@capacitor/app'
import { BackgroundTask } from '@capawesome/capacitor-background-task'

/**
 * Abstract background service class that runs background tasks
 */
export abstract class AbstractBackgroundService {
  // interval for background function via location-updates
  protected abstract foregroundInterval: number
  // interval for background function via independent and limited background-fetch
  protected abstract backgroundInterval: number
  protected backgroundFetchId: string
  protected isEnabled: boolean

  lastTryTime: BehaviorSubject<number> = new BehaviorSubject<number>(0)
  lastRunTime: BehaviorSubject<number> = new BehaviorSubject<number>(0)

  constructor(
    protected backgroundService: BackgroundService,
    backgroundFetchId: string
  ) {
    this.backgroundFetchId = backgroundFetchId
    if (this.isEnabled) {
      this.init()
      App.addListener('appStateChange', async (state) => {
        if (state.isActive) {
          // trigger background function to ensure an up-to-date state of the app
          await this.triggerBackgroundFunctionIfViable(false, true)
        }
      })
    }
  }

  init() {
    this.backgroundService.addBackgroundFunction(this.backgroundFetchId, () =>
      this.internalBackgroundFunction(undefined)
    )
  }

  /**
   * Triggers the background function, if viable.
   * Viability is decided by:
   * - schedule
   * - concurrency
   *
   * @param runAsFetch run background function as fetch, which runs in background, but is less reliable
   *                   if undefined, this is decided by the app-state (active/inactive)
   * @param referToLastRun flag whether schedule references to timestamp of last run or last attempt
   */
  async triggerBackgroundFunctionIfViable(
    runAsFetch?: boolean,
    referToLastRun: boolean = false
  ) {
    if (
      this.backgroundService.backgroundState !== BackgroundState.idle ||
      !this.isEnabled
    ) {
      return
    }
    runAsFetch ??= !(await App.getState()).isActive
    const lastRun = referToLastRun
      ? this.lastRunTime.value
      : this.lastTryTime.value
    if (runAsFetch && Capacitor.isNative) {
      this.triggerBackgroundFunctionAsFetch(lastRun)
    } else {
      await this.triggerBackgroundFunctionAsTask(lastRun)
    }
  }

  /**
   * Triggers background function as a background fetch (if viable).
   * Fetches are executed as background processes.
   * But: they are not reliable, since completely and very strictly managed by the OS.
   *
   * @param lastRunTime last run time that is taken as reference for verifying the schedule.
   */
  private triggerBackgroundFunctionAsFetch(lastRunTime: number) {
    if (this.isWithinSchedule(this.backgroundInterval, lastRunTime)) {
      this.lastTryTime.next(new Date().getTime())
      console.log('triggerBackgroundFunctionAsFetch', this.backgroundFetchId)
      BackgroundFetch.scheduleTask({
        taskId: this.backgroundFetchId,
        delay: 0,
      })
    }
  }

  /**
   * Triggers background function as a background task (if viable).
   * This task is usually started in foreground, but lives on for a small period of time
   * (~30 seconds) after the app becomes inactive.
   *
   * @param lastRunTime last run time that is taken as reference for verifying the schedule.
   */
  private async triggerBackgroundFunctionAsTask(lastRunTime: number) {
    if (this.isWithinSchedule(this.foregroundInterval, lastRunTime)) {
      this.lastTryTime.next(new Date().getTime())
      const taskId = await BackgroundTask.beforeExit(async () => {
        const callback: () => Promise<void> = async () => {
          BackgroundTask.finish({
            taskId,
          })
        }
        this.backgroundService.backgroundState = BackgroundState.foreground

        await this.internalBackgroundFunction(callback)
      })
    }
  }

  private async internalBackgroundFunction(
    callback: () => Promise<void>
  ): Promise<void> {
    try {
      await this.backgroundFunction()
      this.lastRunTime.next(this.lastTryTime.value)
    } finally {
      this.backgroundService.backgroundState = BackgroundState.idle
      if (callback !== undefined) await callback()
    }
  }

  /**
   * The background function to run.
   *
   * @param callback callback function
   */
  protected abstract backgroundFunction(): Promise<void>

  // helper methods

  private isWithinSchedule(interval: number, reference: number): boolean {
    const timestamp = new Date().getTime()
    const diffInMinutes = (timestamp - reference) / 1000 / 60
    return diffInMinutes > interval
  }
}
