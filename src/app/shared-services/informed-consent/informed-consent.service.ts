import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import { InformedConsent, FirstTimeConsent } from './default'

@Injectable({
  providedIn: 'root',
})
export class InformedConsentService {
  constructor(private http: HttpClient) {}

  getInformedConsent(key: string): Observable<InformedConsent> {
    const value = localStorage.getItem(key)
    if (value) {
      return of(JSON.parse(localStorage.getItem(key)))
    } else {
      return this.http.get('/assets/informedConsent/default.json').pipe(
        map((response: any) => {
          const settings = response || {}
          if (settings) {
            this.saveInformedConsent('consent', settings)
          }

          return settings
        })
      )
    }
  }

  saveInformedConsent(key: string, informedConsent: InformedConsent) {
    localStorage.setItem(key, JSON.stringify(informedConsent))
  }

  getFirstTimeConsent(key: string): Observable<FirstTimeConsent> {
    const settings2 = localStorage.getItem(key)

    if (settings2) {
      return of(JSON.parse(settings2))
    } else {
      return this.http.get('/assets/informedConsent/default.json').pipe(
        map((response: any) => {
          const settings3 = response || {}
          if (settings3) {
            this.saveFirstTimeConsent('firstTime', settings3)
          }

          return settings3
        })
      )
    }
  }

  saveFirstTimeConsent(key: string, firstTimeConsent: FirstTimeConsent) {
    localStorage.setItem(key, JSON.stringify(firstTimeConsent))
  }
}
