import { Injectable } from '@angular/core'
import { Trajectory, TrajectoryMeta, TrajectoryType } from '../model/trajectory'
import { TrajectoryService } from '../shared-services/trajectory.service'
import { v4 as uuid } from 'uuid'
import { LoadingController, Platform, ToastController } from '@ionic/angular'
import { HttpClient } from '@angular/common/http'
import { SqliteService } from './db/sqlite.service'
import { LocationService } from './location.service'
import { Plugins } from '@capacitor/core'
import { SocialSharing } from '@ionic-native/social-sharing/ngx'
const { FileSelector } = Plugins

@Injectable()
export class TrajectoryImportExportService extends TrajectoryService {
  constructor(
    http: HttpClient,
    db: SqliteService,
    locationService: LocationService,
    private socialSharing: SocialSharing,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private platform: Platform
  ) {
    super(http, db, locationService)
  }

  async exportTrajectory(trajectoryMeta: TrajectoryMeta) {
    await this.showLoadingDialog('Exporting trajectory...')
    this.getOne(trajectoryMeta.type, trajectoryMeta.id).subscribe((t) => {
      this.exportFullTrajectory(t)
    })
  }

  /**
   * TODO: this works fine for iOS, Android may need adjustments
   * @param t trajectory to share
   */
  private exportFullTrajectory(t: Trajectory) {
    const trajectoryJson = Trajectory.toJSON(t)
    const trajectoryBase64 = btoa(JSON.stringify(trajectoryJson))
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
