import { async } from '@angular/core/testing'
import { ClusteringUtility } from './clustering-utility'
import * as fixtures from './simple-engine.spec.fixtures'

describe('inferences/ClusteringUtility', () => {
  beforeEach(async(() => {}))

  describe('Trajectory Home Work Spatially Dense', () => {
    console.log('Trajectory Home Work Spatially Dense')
    const clusterUtil = new ClusteringUtility()
    clusterUtil.cluster(fixtures.trajectoryHomeWorkSpatiallyDense, true)
  })
})
