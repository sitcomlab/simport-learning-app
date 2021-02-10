import { async } from '@angular/core/testing'
import { LatLngTuple } from 'leaflet'
import { Inference } from 'src/app/model/inference'
import { TrajectoryData } from 'src/app/model/trajectory'
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

    it('should infer with low confidence for low point count', () => {}) // TODO

    it('should not infer for mobile only trajectory', () => {
      const t = new InferenceTestCase(trajMobileOnly, [HomeInference], [])
      t.test(new SimpleEngine())
    })

    it('should infer for single night location', () => {}) // TODO
    it('should infer with low confidence for single 2 different night locations', () => {}) // TODO
    it('should infer for realworld data (1 day)', () => {}) // TODO
    it('should infer for realworld data (1 month)', () => {}) // TODO: nepal dataset?
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
    public results: InferenceResultTest[],
    public deltaMeters: number = 50
  ) {}

  test(e: IInferenceEngine): Inference[] {
    const results = e.infer(this.trajectory, this.inferences)

    // inference count
    expect(results.length).toEqual(
      Object.keys(this.results).length,
      'wrong inferences'
    )

    for (const res of this.results) {
      const hasID = results.some((r) => r.name === res.name)
      expect(hasID).toEqual(true, `'${res.name}' expected, but not inferred`)
    }

    for (const r of results) {
      // inference type matches
      expect(this.results[r.name]).toBeDefined(
        `'${r.name}' inferred, but not expected`
      )

      // inference location
      const deltaMeters = 0.0 // TODO turf.distance()
      expect(deltaMeters).toBeLessThanOrEqual(
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
