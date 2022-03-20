import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import { InformedConsent } from './db/migrations'

const SETTINGS_KEY = 'configuration'

@Injectable({
  providedIn: 'root',
})
export class AppSettingsService {
  constructor(private http: HttpClient) {}
  getInformedConsent(): Observable<InformedConsent> {
    const settings1 = localStorage.getItem(SETTINGS_KEY)

    if (settings1) {
      return of(JSON.parse(settings1))
    } else {
      return this.http.get('/assets/appsettings/appsettings.json').pipe(
        map((response: any) => {
          const settings = response || {}
          if (settings) {
            this.saveInformedConsent(settings)
          }

          return settings
        })
      )
    }
  }

  saveInformedConsent(informedConsent: InformedConsent) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(informedConsent))
  }

  // private appConfig: any

  // constructor(private http: HttpClient) {}

  // loadAppConfig() {
  //   return this.http
  //     .get('/assets/appsettings/appsettings.json')
  //     .toPromise()
  //     .then((data) => {
  //       this.appConfig = data
  //     })
  // }

  // // This is an example property ... you can make it however you want.
  // get informedConsent() {
  //   if (!this.appConfig) {
  //     throw Error('Config file not loaded!')
  //   }

  //   return this.appConfig.informedConsent
  // }
}
