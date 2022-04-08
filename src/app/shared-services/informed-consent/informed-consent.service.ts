// import { Injectable } from '@angular/core'
// import { Observable, of } from 'rxjs'
// import { InformedConsent, FirstTimeConsent } from './default'

// @Injectable({
//   providedIn: 'root',
// })
// export class InformedConsentService {
//   constructor() {}

//   getInformedConsent(key: string): Observable<InformedConsent> {
//     const value = localStorage.getItem(key)
//     if (value) {
//       return of(JSON.parse(localStorage.getItem(key)))
//     } else {
//       const value2 = new InformedConsent()
//       if (value2) {
//         this.saveInformedConsent('consent', value2)
//       }
//       return of<InformedConsent>(value2)
//     }
//   }

//   saveInformedConsent(key: string, informedConsent: InformedConsent) {
//     localStorage.setItem(key, JSON.stringify(informedConsent))
//   }

//   getFirstTimeConsent(key: string): Observable<FirstTimeConsent> {
//     const valueFirst = localStorage.getItem(key)

//     if (valueFirst) {
//       return of(JSON.parse(valueFirst))
//     } else {
//       const valueFirst2 = new FirstTimeConsent()
//       if (valueFirst2) {
//         this.saveFirstTimeConsent('consent', valueFirst2)
//       }
//       return of<FirstTimeConsent>(valueFirst2)
//     }
//   }

//   saveFirstTimeConsent(key: string, firstTimeConsent: FirstTimeConsent) {
//     localStorage.setItem(key, JSON.stringify(firstTimeConsent))
//   }
// }

import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'
import { InformedConsent, FirstTimeConsent } from './informed-constent.fixtures'

@Injectable({
  providedIn: 'root',
})
export class InformedConsentService {
  constructor(private http: HttpClient) {}

  getInformedConsent(key: string): Observable<InformedConsent> {
    const informedConsent = localStorage.getItem(key)
    if (informedConsent) {
      return of(JSON.parse(localStorage.getItem(key)))
    } else {
      const informedConsentDefault = new InformedConsent()
      this.saveInformedConsent('consent', informedConsentDefault)
      return of<InformedConsent>(informedConsentDefault)
    }
  }

  saveInformedConsent(key: string, informedConsent: InformedConsent) {
    localStorage.setItem(key, JSON.stringify(informedConsent))
  }

  getFirstTimeConsent(key: string): Observable<FirstTimeConsent> {
    const firstTimeConsent = localStorage.getItem(key)

    if (firstTimeConsent) {
      return of(JSON.parse(firstTimeConsent))
    } else {
      const firstTimeConsentDefault = new FirstTimeConsent()
      this.saveFirstTimeConsent('consent', firstTimeConsentDefault)
      return of<FirstTimeConsent>(firstTimeConsentDefault)
    }
  }

  saveFirstTimeConsent(key: string, firstTimeConsent: FirstTimeConsent) {
    localStorage.setItem(key, JSON.stringify(firstTimeConsent))
  }
}
