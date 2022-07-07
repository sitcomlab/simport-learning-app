import { Trajectory } from 'src/app/model/trajectory'

// trajectory test files
import trajectoryFileMobileOnly from '../../test-data/test-mobile-only.json'
import trajectoryFileHomeWork from '../../test-data/test-home-work.json'
import trajectoryFileSpatiallyDense from '../../test-data/test-home-work-spatially-dense.json'
import trajectoryFileTemporallySparse from '../../test-data/test-home-work-temporally-sparse.json'
import { InferenceType } from '../types'
import { LatLngTuple } from 'leaflet'

export const trajectoryEmpty = {
  coordinates: [],
  timestamps: [],
  accuracy: [],
}

export const trajectoryMobileOnly = Trajectory.fromJSON(
  trajectoryFileMobileOnly
)

export const trajectoryHomeWork = Trajectory.fromJSON(trajectoryFileHomeWork)

export const trajectoryHomeWorkSpatiallyDense = Trajectory.fromJSON(
  trajectoryFileSpatiallyDense
)

export const trajectoryHomeWorkTemporallySparse = Trajectory.fromJSON(
  trajectoryFileTemporallySparse
)

export const trajectoryHomeResult = {
  name: InferenceType.home,
  location: [51.972509, 7.577781] as LatLngTuple,
}

export const trajectoryWorkResult = {
  name: InferenceType.work,
  location: [51.969284, 7.595887] as LatLngTuple,
}
