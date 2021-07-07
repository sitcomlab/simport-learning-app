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
import {
  Plugins,
  FilesystemDirectory,
  FilesystemEncoding,
} from '@capacitor/core'
import { SocialSharing } from '@ionic-native/social-sharing/ngx'
import { take } from 'rxjs/operators'
const { FileSelector, Filesystem } = Plugins

export interface TrajectoryExportFile {
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

  constructor(
    http: HttpClient,
    db: SqliteService,
    private socialSharing: SocialSharing,
    private platform: Platform
  ) {
    super(http, db)
  }

  /**
   * Invokes a UI that enables the user to select and import
   * a trajectory-json on iOS and Android.
   */
  async selectAndImportTrajectory(
    didSelectFileCallback: () => void
  ): Promise<TrajectoryImportResult> {
    const selectedFile = await FileSelector.fileSelector({
      multiple_selection: false,
      ext: ['*'],
    })
    didSelectFileCallback()
    if (this.platform.is('android')) {
      const parsedPaths = JSON.parse(selectedFile.paths)
      const parsedOriginalNames = JSON.parse(selectedFile.original_names)
      const parsedExtensions = JSON.parse(selectedFile.extensions)
      for (let index = 0; index < parsedPaths.length; index++) {
        const file = await fetch(parsedPaths[index]).then((r) => r.blob())
        return await this.importFile(
          file,
          parsedOriginalNames[index],
          parsedExtensions[index]
        )
      }
    } else if (this.platform.is('ios')) {
      for (let index = 0; index < selectedFile.paths.length; index++) {
        const file = await fetch(selectedFile.paths[index]).then((r) =>
          r.blob()
        )
        return await this.importFile(
          file,
          selectedFile.original_names[index],
          selectedFile.extensions[index]
        )
      }
    }
    return {
      success: false,
      errorMessage: 'Trajectory could not be imported',
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
  createTrajectoryFromImport(json: string, name: string): Trajectory {
    const trajectoryJson: {
      coordinates: string
      timestamps: number[]
      time0: string
      timeN?: string
    } = JSON.parse(json)
    const data = Trajectory.fromJSON(trajectoryJson)
    const placename = name?.replace(/\.[^/.]+$/, '') ?? 'trajectory' // remove extension from name (e.g. '.json')
    const meta: TrajectoryMeta =
      TrajectoryImportExportService.importAsUserTrajectory
        ? {
            id: Trajectory.trackingTrajectoryID,
            placename,
            type: TrajectoryType.USERTRACK,
            durationDays: null,
          }
        : {
            id: uuid(),
            placename,
            type: TrajectoryType.IMPORT,
            durationDays: null,
          }
    return new Trajectory(meta, data)
  }

  private async importFile(
    file: Blob,
    name: string,
    extension: string
  ): Promise<TrajectoryImportResult> {
    if (!extension.toLowerCase().endsWith('json')) {
      return {
        success: false,
        trajectoryId: null,
        errorMessage: 'Please select JSON-files',
      }
    }

    try {
      const reader = new FileReader()
      reader.readAsText(file)
      return new Promise((resolve) => {
        reader.onload = async () => {
          const json = reader.result.toString()
          const trajectory = this.createTrajectoryFromImport(json, name)
          return this.addTrajectory(trajectory)
            .then(async () => {
              resolve({
                success: true,
                trajectoryId: trajectory.id,
                errorMessage: null,
              })
            })
            .catch(async () => {
              resolve({
                success: false,
                trajectoryId: trajectory.id,
                errorMessage: 'Trajectory could not be imported',
              })
            })
        }
      })
    } catch (e) {
      return {
        success: false,
        trajectoryId: null,
        errorMessage: 'Trajectory could not be imported',
      }
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
      true
    )
    const sharingOptions = {
      files: [
        `df:${trajectoryFile.filename}.json;data:application/json;base64,${trajectoryFile.trajectory}`,
      ],
      chooserTitle: 'Exporting trajectory', // android-only dialog-title
    }
    return this.socialSharing
      .shareWithOptions(sharingOptions)
      .then(async (result: { completed: boolean; app: string }) => {
        return {
          success: result.completed,
          errorMessage: 'Trajectory could not be exported',
        }
      })
      .catch(async () => {
        return {
          success: false,
          errorMessage: 'Trajectory could not be exported',
        }
      })
  }

  /**
   * This is android-only.
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
        directory: FilesystemDirectory.ExternalStorage,
        encoding: FilesystemEncoding.UTF8,
      })
      return { success: true, errorMessage: null }
    } catch (e) {
      return {
        success: false,
        errorMessage: 'Trajectory could not be exported',
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
