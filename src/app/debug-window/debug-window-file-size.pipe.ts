import { Pipe, PipeTransform } from '@angular/core'

const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
@Pipe({
  name: 'formatFileSize',
})
export class DebugWindowFormatFileSizePipe implements PipeTransform {
  transform(sizeInBytes: number): string {
    let power = Math.round(Math.log(sizeInBytes) / Math.log(1024))
    power = Math.min(power, FILE_SIZE_UNITS.length - 1)

    const size = sizeInBytes / Math.pow(1024, power) // size in new units
    const formattedSize = Math.round(size * 100) / 100 // keep up to 2 decimals
    const unit = FILE_SIZE_UNITS[power]

    return `${formattedSize} ${unit}`
  }
}
