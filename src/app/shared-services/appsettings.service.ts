import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { InformedConsent } from './db/migrations'

@Injectable({
  providedIn: 'root',
})
export class AppSettingsService {
  getInformedConsent(): Observable<InformedConsent> {
    const informedConsent = new InformedConsent()
    return of<InformedConsent>(informedConsent)
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
