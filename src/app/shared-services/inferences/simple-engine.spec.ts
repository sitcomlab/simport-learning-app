import { async } from '@angular/core/testing'
import distance from '@turf/distance'
import { LatLngTuple } from 'leaflet'
import { Inference } from 'src/app/model/inference'
import { Trajectory, TrajectoryData } from 'src/app/model/trajectory'
import nepal from 'src/assets/trajectories/3384596.json'
import { AllInferences, HomeInference } from './definitions'
import { SimpleEngine } from './simple-engine'
import { trajEmpty, trajMobileOnly } from './simple-engine.spec.fixtures'
import { IInferenceEngine, InferenceDefinition } from './types'

describe('inferences/SimpleEngine', () => {
  beforeEach(async(() => {}))

  it('should create', () => {
    const e = new SimpleEngine()
    expect(e).toBeTruthy()
  })

  describe('HomeInference', () => {
    it('should not infer for 0 points', () => {
      const t = new InferenceTestCase(
        trajEmpty,
        Object.values(AllInferences),
        []
      )
      t.test(new SimpleEngine())
    })

    it('should infer with low confidence for low stationary point count', () => {}) // TODO

    it('should infer with low confidence for low total point count', () => {}) // TODO

    it('should not infer for mobile only trajectory', () => {
      const t = new InferenceTestCase(trajMobileOnly, [HomeInference], [])
      t.test(new SimpleEngine())
    })

    it('should infer for single night location', () => {}) // TODO

    it('should infer with low confidence for 2 different night locations', () => {}) // TODO

    it('should infer for realworld data (1 day)', () => {}) // TODO

    it('should infer for realworld data (1 month)', () => {
      // NOTE: nepal trajectory seems to be partially everyday-life, partially dedicated OSM-mapping activities
      expect(nepal).toBeDefined('nepal fixture not loaded')
      const t = new InferenceTestCase(
        Trajectory.fromJSON(nepal),
        [HomeInference],
        [] // TODO
      )
      t.test(new SimpleEngine())
    })

    it('should infer for realworld data (1 year)', () => {}) // TODO: find data

    // TODO: test temporally, spatially sparse trajectories
  })

  describe('WorkInference', () => {
    // TODO: migrate from HomeInference, once done
  })
})

class InferenceTestCase {
  constructor(
    public trajectory: TrajectoryData,
    public inferences: InferenceDefinition[],
    public expected: InferenceResultTest[],
    public deltaMeters: number = 50
  ) {}

  test(e: IInferenceEngine): Inference[] {
    const results = e.infer(this.trajectory, this.inferences)

    // inference count
    expect(results.length).toEqual(
      Object.keys(this.expected).length,
      'wrong inferences'
    )

    for (const res of this.expected) {
      const hasID = results.some((r) => r.name === res.name)
      expect(hasID).toEqual(true, `'${res.name}' expected, but not inferred`)
    }

    for (const r of results) {
      const expectation = this.expected.find(({ name }) => r.name === name)

      // inference type matches
      expect(expectation).toBeDefined(`'${r.name}' inferred, but not expected`)

      // inference location
      const expectedLonLat = [expectation.location[1], expectation.location[0]]
      const inferredLonLat = [r.lonLat[1], r.lonLat[0]]
      const dist = distance(expectedLonLat, inferredLonLat, {
        units: 'kilometers',
      })
      expect(dist * 1000).toBeLessThanOrEqual(
        this.deltaMeters,
        `'${r.name}' location didn't match`
      )
    }

    return results
  }
}

type InferenceResultTest = {
  name: string
  location: LatLngTuple
}
