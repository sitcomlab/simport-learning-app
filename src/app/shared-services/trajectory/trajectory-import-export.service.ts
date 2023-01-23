import { Injectable } from '@angular/core'
import {
  Trajectory,
  TrajectoryMeta,
  TrajectoryType,
} from '../../model/trajectory'
import { TrajectoryService } from '../../shared-services/trajectory/trajectory.service'
import { v4 as uuid } from 'uuid'
import { Platform } from '@ionic/angular'
import { HttpClient } from '@angular/common/http'
import { SqliteService } from '../db/sqlite.service'

import { take } from 'rxjs/operators'
import { TranslateService } from '@ngx-translate/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { FilePicker } from '@capawesome/capacitor-file-picker'

interface TrajectoryExportFile {
  trajectory: string
  filename: string
}

export interface TrajectoryExportResult {
  success: boolean
  errorMessage: string
}

export interface TrajectoryImportResult {
  success: boolean
  trajectoryId: string
  errorMessage: string
}

@Injectable()
export class TrajectoryImportExportService extends TrajectoryService {
  /**
   * This flags enables importing trajectories as user-trajectories,
   * it is for debug-purposes only and must be 'false' when pushed remotely.
   */
  private static importAsUserTrajectory = false
  private static importMimeType = 'application/json'

  constructor(
    http: HttpClient,
    db: SqliteService,
    private platform: Platform,
    private translateService: TranslateService
  ) {
    super(http, db)
  }

  /**
   * Invokes a UI that enables the user to select and import
   * a trajectory-json on iOS and Android.
   */
  async selectAndImportTrajectory(
    didSelectFileCallback: () => Promise<void>
  ): Promise<TrajectoryImportResult> {
    const filePickResult = await FilePicker.pickFiles({
      multiple: false,
      readData: true,
      types: [TrajectoryImportExportService.importMimeType],
    })
    await didSelectFileCallback()
    try {
      const selectedFile = filePickResult.files[0]
      if (selectedFile.data) {
        return await this.importFile(
          selectedFile.data,
          selectedFile.name,
          selectedFile.mimeType
        )
      }
    } catch (e) {}
    return {
      success: false,
      errorMessage: this.translateService.instant(
        'trajectory.import.errorMessage'
      ),
      trajectoryId: null,
    }
  }

  /**
   * Translates a trajectory in form of a JSON {@linkcode TrajectoryJSON}
   * into a model class {@linkcode Trajectory}
   *
   * @param json trajectory-file as JSON, see {@linkcode TrajectoryJSON}
   * @param name file name of imported JSON
   *
   * @returns trajectory
   */
  createTrajectoryFromImport(
    json: string,
    name: string,
    example?: boolean
  ): Trajectory {
    try {
      // try to read given json-string as a trajectory
      const trajectoryJson: {
        coordinates: string
        timestamps: number[]
        time0: string
        timeN?: string
      } = JSON.parse(json)
      const data = Trajectory.fromJSON(trajectoryJson)
      const placename = name?.replace(/\.[^/.]+$/, '') ?? 'trajectory' // remove extension from name (e.g. '.json')
      const trajectoryId = example ? 'example' : uuid()
      const meta: TrajectoryMeta =
        TrajectoryImportExportService.importAsUserTrajectory
          ? {
              id: Trajectory.trackingTrajectoryID,
              placename,
              type: TrajectoryType.USERTRACK,
              durationDays: null,
            }
          : {
              id: trajectoryId,
              placename,
              type: TrajectoryType.IMPORT,
              durationDays: null,
            }
      return new Trajectory(meta, data)
    } catch (e) {
      return undefined
    }
  }

  async importFile(
    fileBase64: string,
    name: string,
    extension: string
  ): Promise<TrajectoryImportResult> {
    if (!extension.toLowerCase().endsWith('json')) {
      return {
        success: false,
        trajectoryId: null,
        errorMessage: this.translateService.instant(
          'trajectory.import.fileTypeErrorMessage'
        ),
      }
    }

    try {
      const file = atob(fileBase64)
      const trajectory = this.createTrajectoryFromImport(file, name)
      await this.addTrajectory(trajectory)
      return {
        success: true,
        trajectoryId: trajectory.id,
        errorMessage: null,
      }
    } catch (e) {}
    return {
      success: false,
      trajectoryId: null,
      errorMessage: this.translateService.instant(
        'trajectory.import.errorMessage'
      ),
    }
  }

  /**
   * @param t trajectory to share
   */
  async exportTrajectoryViaShareDialog(
    trajectoryMeta: TrajectoryMeta
  ): Promise<TrajectoryExportResult> {
    const trajectoryFile = await this.createTrajectoryExportFileFromMeta(
      trajectoryMeta,
      false
    )

    try {
      // write file temporarily
      const fileResult = await Filesystem.writeFile({
        data: trajectoryFile.trajectory,
        path: `${trajectoryFile.filename}.json`,
        directory: Directory.Cache, // write in cache as temp folder
        encoding: Encoding.UTF8,
      })

      if (this.platform.is('android')) {
        // await Share.requestPermissions()
      }

      // share file
      await Share.share({
        title: this.translateService.instant('trajectory.export.alertHeader'),
        url: fileResult.uri,
        dialogTitle: this.translateService.instant(
          'trajectory.export.alertHeader'
        ),
      })

      return {
        success: true,
        errorMessage: this.translateService.instant(
          'trajectory.export.errorMessage'
        ),
      }
    } catch (error) {
      return {
        success: false,
        errorMessage: `${this.translateService.instant(
          'trajectory.export.errorMessage'
        )}: ${error.errorMessage ? error.errorMessage : error}`,
      }
    }
  }

  /**
   * This is android-only.
   *
   * @param t trajectory to export
   */
  async exportTrajectoryToDownloads(
    trajectoryMeta: TrajectoryMeta
  ): Promise<TrajectoryExportResult> {
    const trajectoryFile = await this.createTrajectoryExportFileFromMeta(
      trajectoryMeta,
      false
    )
    try {
      await Filesystem.writeFile({
        path: `Download/${trajectoryFile.filename}.json`,
        data: trajectoryFile.trajectory,
        directory: Directory.ExternalStorage,
        encoding: Encoding.UTF8,
      })
      return { success: true, errorMessage: null }
    } catch (e) {
      return {
        success: false,
        errorMessage: this.translateService.instant(
          'trajectory.export.errorMessage'
        ),
      }
    }
  }

  /**
   * Translates trajectory from model class {@linkcode TrajectoryMeta}
   * into JSON-format specified by {@linkcode TrajectoryJSON}
   *
   * @param trajectoryMeta metadata of trajectory
   * @param useBase64 flag that indicates, whether to encode with base64 or not
   */
  async createTrajectoryExportFileFromMeta(
    trajectoryMeta: TrajectoryMeta,
    useBase64: boolean
  ): Promise<TrajectoryExportFile> {
    const trajectory = await this.getOne(trajectoryMeta.type, trajectoryMeta.id)
      .pipe(take(1))
      .toPromise()
    return this.createTrajectoryExportFile(trajectory, useBase64)
  }

  async createTrajectoryExportFile(
    trajectory: Trajectory,
    useBase64: boolean
  ): Promise<TrajectoryExportFile> {
    const trajectoryJson = Trajectory.toJSON(trajectory)
    const trajectoryJsonString = JSON.stringify(trajectoryJson)
    const trajectoryJsonStringEncoded = useBase64
      ? btoa(trajectoryJsonString)
      : trajectoryJsonString
    const filename =
      trajectory.placename.length > 0 ? trajectory.placename : 'trajectory'
    return { trajectory: trajectoryJsonStringEncoded, filename }
  }
}
