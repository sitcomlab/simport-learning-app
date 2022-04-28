import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { InformedConsentDefaults } from './informed-constent.fixtures'

@Injectable({
  providedIn: 'root',
})
export class InformedConsentService {
  constructor() {}

  getInformedConsent(key: string): Observable<InformedConsentDefaults> {
    const informedConsent = localStorage.getItem(key)
    if (informedConsent) {
      return of(JSON.parse(localStorage.getItem(key)))
    } else {
      const informedConsentDefault = new InformedConsentDefaults()
      this.saveInformedConsent('consent', informedConsentDefault)
      return of<InformedConsentDefaults>(informedConsentDefault)
    }
  }

  saveInformedConsent(key: string, informedConsent: InformedConsentDefaults) {
    localStorage.setItem(key, JSON.stringify(informedConsent))
  }
}
