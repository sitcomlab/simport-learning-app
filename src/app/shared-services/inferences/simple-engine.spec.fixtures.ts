import { Trajectory } from 'src/app/model/trajectory'

// trajectory test files
import trajectoryFileMobileOnly from './test-data/test-mobile-only.json'
import trajectoryFileHomeWork from './test-data/test-home-work.json'
import trajectoryFileSpatiallyDense from './test-data/test-home-work-spatially-dense.json'
import trajectoryFileTemporallySparse from './test-data/test-home-work-temporally-sparse.json'
import trajectoryNepalFile from 'src/assets/trajectories/3384596.json'

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
