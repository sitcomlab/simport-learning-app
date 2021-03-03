import { TestBed } from '@angular/core/testing'

import { TrajectoryImportExportService } from './trajectory-import-export.service'

import { LocationService } from './location.service'
import { SqliteService } from './db/sqlite.service'
import { HttpClient, HttpHandler } from '@angular/common/http'
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx'
import { LocalNotifications } from '@ionic-native/local-notifications/ngx'
import { SocialSharing } from '@ionic-native/social-sharing/ngx'
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx'
import {
  testTrajectory,
  testTrajectoryBase64String,
  testTrajectoryName,
  testTrajectoryString,
} from './trajectory-import-export.service.spec.fixtures'
import { TrajectoryType } from '../model/trajectory'

describe('TrajectoryImportExportService', () => {
  let service: TrajectoryImportExportService

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TrajectoryImportExportService,
        LocationService,
        SqliteService,
        HttpClient,
        HttpHandler,
        BackgroundGeolocation,
        LocalNotifications,
        SocialSharing,
        AndroidPermissions,
      ],
    })
    service = TestBed.inject(TrajectoryImportExportService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should import and export a trajectory', () => {
    const importedTrajectory = service.createTrajectoryFromImport(
      testTrajectoryString,
      testTrajectoryName
    )

    // don't test for id, since it will be a new uuid which we can't predict
    expect(importedTrajectory.placename).toEqual(testTrajectory.placename)
    expect(importedTrajectory.durationDays).toEqual(testTrajectory.durationDays)
    expect(importedTrajectory.type).toEqual(TrajectoryType.IMPORT)
    expect(importedTrajectory.accuracy).toEqual(testTrajectory.accuracy)
    expect(importedTrajectory.timestamps).toEqual(testTrajectory.timestamps)
    expect(importedTrajectory.coordinates).toEqual(testTrajectory.coordinates)

    // re-exported trajectory should match the original trajectory (with and without base64 encoding)
    const exportJson = service.createTrajectoryStringForExport(
      importedTrajectory,
      false
    )
    expect(exportJson).toMatch(testTrajectoryString.replace(/\s/g, ''))
    const exportBase64Json = service.createTrajectoryStringForExport(
      importedTrajectory,
      true
    )
    expect(exportBase64Json).toMatch(
      testTrajectoryBase64String.replace(/\s/g, '')
    )
  })
})
