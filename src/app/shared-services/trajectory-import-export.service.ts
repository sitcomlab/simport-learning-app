import { Injectable } from '@angular/core'
import { Trajectory, TrajectoryMeta, TrajectoryType } from '../model/trajectory'
import { TrajectoryService } from '../shared-services/trajectory.service'
import { v4 as uuid } from 'uuid'
import {
  ActionSheetController,
  LoadingController,
  Platform,
  ToastController,
} from '@ionic/angular'
import { HttpClient } from '@angular/common/http'
import { SqliteService } from './db/sqlite.service'
import { LocationService } from './location.service'
import {
  Plugins,
  FilesystemDirectory,
  FilesystemEncoding,
} from '@capacitor/core'
import { SocialSharing } from '@ionic-native/social-sharing/ngx'
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx'
const { FileSelector, Filesystem } = Plugins

@Injectable()
export class TrajectoryImportExportService extends TrajectoryService {
  constructor(
    http: HttpClient,
    db: SqliteService,
    locationService: LocationService,
    private socialSharing: SocialSharing,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private androidPermissions: AndroidPermissions,
    private platform: Platform
  ) {
    super(http, db, locationService)
  }

  async selectAndImportTrajectory() {
    const selectedFile = await FileSelector.fileSelector({
      multiple_selection: false,
      ext: ['*'],
    })
    if (this.platform.is('android')) {
      const parsedPaths = JSON.parse(selectedFile.paths)
      const parsedOriginalNames = JSON.parse(selectedFile.original_names)
      const parsedExtensions = JSON.parse(selectedFile.extensions)
      for (let index = 0; index < parsedPaths.length; index++) {
        const file = await fetch(parsedPaths[index]).then((r) => r.blob())
        await this.importFile(
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
        await this.importFile(
          file,
          selectedFile.original_names[index],
          selectedFile.extensions[index]
        )
      }
    } else {
      FileSelector.addListener('onFilesSelected', async (data: FileList) => {
        for (let index = 0; index < data.length; index++) {
          await this.importFile(
            data.item(index),
            data.item(index).name,
            data.item(index).type
          )
        }
      })
    }
  }

  async exportTrajectory(trajectoryMeta: TrajectoryMeta) {
    this.getOne(trajectoryMeta.type, trajectoryMeta.id).subscribe(async (t) => {
      if (this.platform.is('android')) {
        await this.presentExportActionSheet(t)
      } else {
        await this.exportTrajectoryViaShareDialog(t)
      }
    })
  }

  /**
   * This is android-only.
   * @param t trajectory to export
   */
  private async exportTrajectoryToDownloads(t: Trajectory) {
    await this.showLoadingDialog('Exporting trajectory...')
    const trajectoryString = Trajectory.toJSONString(t, false)
    try {
      const fileName = t.placename.length > 0 ? t.placename : 'trajectory'
      await Filesystem.writeFile({
        path: `Download/${fileName}.json`,
        data: trajectoryString,
        directory: FilesystemDirectory.ExternalStorage,
        encoding: FilesystemEncoding.UTF8,
      })
      this.hideLoadingDialog()
      await this.showToast('Trajectory export successful', false)
    } catch (e) {
      this.hideLoadingDialog()
      await this.showToast(
        'Trajectory export failed ' + JSON.stringify(e),
        true
      )
    }
  }

  /**
   * @param t trajectory to share
   */
  private async exportTrajectoryViaShareDialog(t: Trajectory) {
    await this.showLoadingDialog('Exporting trajectory...')
    const trajectoryBase64 = Trajectory.toJSONString(t, true)
    const fileName = t.placename.length > 0 ? t.placename : 'trajectory'
    const sharingOptions = {
      files: [
        `df:${fileName}.json;data:application/json;base64,${trajectoryBase64}`,
      ],
      chooserTitle: 'Exporting trajectory', // android-only dialog-title
    }
    this.hideLoadingDialog()
    this.socialSharing
      .shareWithOptions(sharingOptions)
      .then(async (result: { completed: boolean; app: string }) => {
        if (result.completed) {
          await this.showToast('Trajectory export successful', false)
        }
      })
      .catch(async () => {
        await this.showToast('Trajectory export failed', true)
      })
  }

  private async importFile(file: Blob, name: string, extension: string) {
    if (!extension.toLowerCase().endsWith('json')) {
      await this.showToast('Please select JSON-files', true)
    } else {
      try {
        await this.showLoadingDialog('Importing trajectory...')
        const reader = new FileReader()
        reader.readAsText(file)
        reader.onload = () => {
          const json = reader.result.toString()
          const trajectoryJson: {
            coordinates: string
            timestamps: number[]
            time0: string
            timeN?: string
          } = JSON.parse(json)
          const data = Trajectory.fromJSON(trajectoryJson)
          const meta: TrajectoryMeta = {
            id: uuid(),
            placename: name.replace(/\.[^/.]+$/, ''), // remove extension from name (e.g. '.json')
            type: TrajectoryType.IMPORT,
            durationDays: null,
          }
          const trajectory = new Trajectory(meta, data)
          this.addTrajectory(trajectory)
            .then(async () => {
              await this.hideLoadingDialog()
              await this.showToast('Trajectory successfully imported', false)
            })
            .catch(async () => {
              await this.hideLoadingDialog()
              await this.showToast('Trajectory could not be imported', true)
            })
        }
      } catch (e) {
        await this.hideLoadingDialog()
        await this.showToast('Trajectory could not be imported', true)
      }
    }
  }

  private assurePermissionsAndExportToDownloads(t: Trajectory) {
    this.androidPermissions
      .checkPermission(
        this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE
      )
      .then(async (status) => {
        if (status.hasPermission) {
          await this.exportTrajectoryToDownloads(t)
        } else {
          this.androidPermissions
            .requestPermission(
              this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE
            )
            .then(async (requestStatus) => {
              if (requestStatus.hasPermission) {
                await this.exportTrajectoryToDownloads(t)
              } else {
                await this.showToast(
                  'Trajectory could not be exported as permissions were denied',
                  true
                )
              }
            })
        }
      })
  }

  private async presentExportActionSheet(t: Trajectory) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Export trajectory',
      buttons: [
        {
          text: 'Save to downloads',
          icon: 'save-outline',
          handler: () => {
            this.assurePermissionsAndExportToDownloads(t)
          },
        },
        {
          text: 'Share',
          icon: 'share-social-outline',
          handler: async () => {
            await this.exportTrajectoryViaShareDialog(t)
          },
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
        },
      ],
    })
    await actionSheet.present()
  }

  private async showLoadingDialog(message: string) {
    const loading = await this.loadingController.create({
      message,
      translucent: true,
    })
    await loading.present()
  }

  private async hideLoadingDialog() {
    await this.loadingController.dismiss()
  }

  private async showToast(message: string, isError: boolean) {
    const toast = await this.toastController.create({
      message,
      color: isError ? 'danger' : 'medium',
      duration: 1000,
    })
    toast.present()
  }
}
