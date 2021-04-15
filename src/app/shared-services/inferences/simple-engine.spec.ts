import { async } from '@angular/core/testing'
import distance from '@turf/distance'
import { LatLngTuple } from 'leaflet'
import { Inference } from 'src/app/model/inference'
import { TrajectoryData } from 'src/app/model/trajectory'
import { AllInferences, HomeInference, WorkInference } from './definitions'
import { SimpleEngine } from './simple-engine'
import * as fixtures from './simple-engine.spec.fixtures'
import { IInferenceEngine, InferenceDefinition } from './types'
import haversine from 'haversine-distance'

describe('inferences/SimpleEngine', () => {
  beforeEach(async(() => {}))

  it('should create', () => {
    const e = new SimpleEngine()
    expect(e).toBeTruthy()
  })

  describe('HomeInference', () => {
    it('should not infer for 0 points', () => {
      const t = new InferenceTestCase(
        fixtures.trajectoryEmpty,
        Object.values(AllInferences),
        []
      )
      t.test(new SimpleEngine())
    })

    it('should infer with low confidence for low stationary point count', () => {}) // TODO

    it('should infer with low confidence for low total point count', () => {}) // TODO

    it('should not infer for mobile only trajectory', () => {
      const t = new InferenceTestCase(
        fixtures.trajectoryMobileOnly,
        [HomeInference, WorkInference],
        []
      )
      t.test(new SimpleEngine())
    })

    // it('should infer for home-work data', () => {
    //   const t = new InferenceTestCase(
    //     fixtures.trajectoryHomeWork,
    //     [HomeInference, WorkInference],
    //     [fixtures.trajectoryHomeResult, fixtures.trajectoryWorkResult]
    //   )
    //   t.test(new SimpleEngine())
    // })

    it('should infer for spatially dense data', () => {
      const t = new InferenceTestCase(
        fixtures.trajectoryHomeWorkSpatiallyDense,
        [HomeInference, WorkInference],
        [fixtures.trajectoryHomeResult, fixtures.trajectoryWorkResult]
      )
      t.test(new SimpleEngine())
    })

    it('should infer for temporally sparse data', () => {
      const t = new InferenceTestCase(
        fixtures.trajectoryHomeWorkTemporallySparse,
        [HomeInference, WorkInference],
        [fixtures.trajectoryHomeResult, fixtures.trajectoryWorkResult]
      )
      t.test(new SimpleEngine())
    })

    it('should infer for single night location', () => {}) // TODO

    it('should infer with low confidence for 2 different night locations', () => {}) // TODO

    it('should infer for realworld data (1 day)', () => {}) // TODO

    // it('should infer for realworld data (1 month)', () => {
    //   // NOTE: nepal trajectory seems to be partially everyday-life, partially dedicated OSM-mapping activities
    //   const t = new InferenceTestCase(
    //     fixtures.trajectoryNepal,
    //     [HomeInference],
    //     [] // TODO
    //   )
    //   t.test(new SimpleEngine())
    // })

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
    let result = e.infer(this.trajectory, this.inferences)
    result.inferences = result.inferences.filter((res) => {
      return res.confidence >= 0.5
    })

    // inference count
    expect(result.inferences.length).toEqual(
      Object.keys(this.expected).length,
      'wrong inferences'
    )

    for (const res of this.expected) {
      const hasID = result.inferences.some((r) => r.name === res.name)
      expect(hasID).toEqual(true, `'${res.name}' expected, but not inferred`)
    }

    for (const r of result.inferences) {
      const expectation = this.expected.find(({ name }) => r.name === name)

      // inference type matches
      expect(expectation).toBeDefined(`'${r.name}' inferred, but not expected`)

      // inference location
      const expectedLonLat = [expectation.location[1], expectation.location[0]]
      const inferredLonLat = [r.lonLat[0], r.lonLat[1]]
      const dist = computeHaversineDistance(expectedLonLat, inferredLonLat)
      expect(dist).toBeLessThanOrEqual(
        this.deltaMeters,
        `'${r.name}' location didn't match`
      )
    }

    return result.inferences
  }
}

function computeHaversineDistance(firstCoordinate, secondCoordinate): number {
  const a = { latitude: firstCoordinate[1], longitude: firstCoordinate[0] }
  const b = { latitude: secondCoordinate[1], longitude: secondCoordinate[0] }
  return haversine(a, b)
}

type InferenceResultTest = {
  name: string
  location: LatLngTuple
}
