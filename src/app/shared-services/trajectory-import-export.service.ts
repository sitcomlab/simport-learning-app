import { Injectable } from '@angular/core'
import { Trajectory, TrajectoryMeta, TrajectoryType } from '../model/trajectory'
import { TrajectoryService } from '../shared-services/trajectory.service'
import { v4 as uuid } from 'uuid'
import { Platform, ToastController } from '@ionic/angular'
import { HttpClient } from '@angular/common/http'
import { SqliteService } from './db/sqlite.service'
import { LocationService } from './location.service'
import { Plugins } from '@capacitor/core'
const { FileSelector } = Plugins

@Injectable()
export class TrajectoryImportExportService extends TrajectoryService {
  constructor(
    http: HttpClient,
    db: SqliteService,
    locationService: LocationService,
    private toastController: ToastController,
    private platform: Platform
  ) {
    super(http, db, locationService)
  }

  async selectAndImportFile() {
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
        this.importFile(
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
        this.importFile(
          file,
          selectedFile.original_names[index],
          selectedFile.extensions[index]
        )
      }
    } else {
      FileSelector.addListener('onFilesSelected', (data: FileList) => {
        for (let index = 0; index < data.length; index++) {
          this.importFile(
            data.item(index),
            data.item(index).name,
            data.item(index).type
          )
        }
      })
    }
  }

  private async importFile(file: Blob, name: string, extension: string) {
    if (extension.toLowerCase() !== 'json') {
      await this.showToast('Please select JSON-files', true)
    } else {
      try {
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
          this.showToast('Trajectory successfully imported', false)
        }
      } catch (e) {
        await this.showToast('Trajectory could not be imported', true)
      }
    }
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
