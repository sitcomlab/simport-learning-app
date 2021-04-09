import { Trajectory } from 'src/app/model/trajectory'

// trajectory test files
import trajectoryFileMobileOnly from './test-data/test-mobile-only.json'
import trajectoryFileHomeWork from './test-data/test-home-work.json'
import trajectoryFileSpatiallyDense from './test-data/test-home-work-spatially-dense.json'
import trajectoryFileTemporallySparse from './test-data/test-home-work-temporally-sparse.json'
import trajectoryNepalFile from 'src/assets/trajectories/3384596.json'
import { InferenceType } from './types'
import { InferenceResultTest } from './simple-engine.spec'

export const trajectoryEmpty = {
  coordinates: [],
  timestamps: [],
  accuracy: [],
}

export const trajectoryNepal = Trajectory.fromJSON(trajectoryNepalFile)

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

export const trajectoryHomeResult: InferenceResultTest = {
  name: InferenceType.home,
  location: [51.972509, 7.577781],
}

export const trajectoryWorkResult: InferenceResultTest = {
  name: InferenceType.work,
  location: [51.969284, 7.595887],
}
