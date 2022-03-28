import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import { InformedConsent, FirstTimeConsent } from './default'

const SETTINGS_KEY = 'configuration'

@Injectable({
  providedIn: 'root',
})
export class InformedConsentService {
  constructor(private http: HttpClient) {}
  getInformedConsent(): Observable<InformedConsent> {
    const settings1 = localStorage.getItem(SETTINGS_KEY)

    if (settings1) {
      return of(JSON.parse(settings1))
    } else {
      return this.http.get('/assets/informedConsent/default.json').pipe(
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

  getFirstTimeConsent(): Observable<FirstTimeConsent> {
    const settings2 = localStorage.getItem(SETTINGS_KEY)

    if (settings2) {
      return of(JSON.parse(settings2))
    } else {
      return this.http.get('/assets/informedConsent/default.json').pipe(
        map((response: any) => {
          const settings3 = response || {}
          if (settings3) {
            this.saveFirstTimeConsent(settings3)
          }

          return settings3
        })
      )
    }
  }

  saveFirstTimeConsent(firstTimeConsent: FirstTimeConsent) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(firstTimeConsent))
  }

  saveInformedConsent(informedConsent: InformedConsent) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(informedConsent))
  }
}
