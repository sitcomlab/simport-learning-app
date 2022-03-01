import { Router } from '@angular/router'
import { Component } from '@angular/core'

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  constructor(private router: Router) {}

  toImprint() {
    this.router.navigate(['/settings/imprint'])
  }

  toOpenSources() {
    this.router.navigate(['/settings/oss-licenses'])
  }
  toPrivacyPolicy() {
    this.router.navigate(['/settings/privacy-policy'])
  }
}
