import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { InformedConsentDefaults } from './informed-constent.fixtures'

@Injectable({
  providedIn: 'root',
})
export class InformedConsentService {
  static readonly CONSET_STORAGE_KEY = 'consent'

  constructor() {}

  getInformedConsent(): Observable<InformedConsentDefaults> {
    const informedConsent = localStorage.getItem(
      InformedConsentService.CONSET_STORAGE_KEY
    )
    if (informedConsent) {
      return of(
        JSON.parse(
          localStorage.getItem(InformedConsentService.CONSET_STORAGE_KEY)
        )
      )
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
