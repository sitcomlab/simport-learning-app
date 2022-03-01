import { Component } from '@angular/core'

import licenseFile from 'src/assets/licenses.json'

interface LicenseFile {
  [key: string]: License
}

interface License {
  licenses: string
  path: string
  repository?: string
  publisher?: string
  licenseFile?: string
}

@Component({
  selector: 'app-open-sources',
  templateUrl: './open-sources.page.html',
  styleUrls: ['./open-sources.page.scss'],
})
export class OpenSourcesPage {
  licenses: LicenseFile = licenseFile

  constructor() {}

  get licensesArray() {
    return Object.keys(this.licenses).map((l) => ({
      name: l,
      ...this.licenses[l],
    }))
  }
}
