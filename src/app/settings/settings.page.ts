import { Router } from '@angular/router'
import { Component, OnInit } from '@angular/core'

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  constructor(private router: Router) {}

  toImprint() {
    this.router.navigate(['/settings/imprint'])
  }

  toOpenSources() {
    this.router.navigate(['/settings/oss-licenses'])
  }

  ngOnInit() {}
}
