import { async } from '@angular/core/testing'
import { LatLngTuple } from 'leaflet'
import { Inference } from 'src/app/model/inference'
import {
  Trajectory,
  TrajectoryData,
  TrajectoryMeta,
  TrajectoryType,
} from 'src/app/model/trajectory'
import { HomeInference, WorkInference } from '../definitions'
import { SimpleEngine } from './simple-engine'
import * as fixtures from './simple-engine.spec.fixtures'
import { IInferenceEngine, InferenceDefinition } from '../types'
import haversine from 'haversine-distance'

describe('inferences/SimpleEngine', () => {
  beforeEach(() => {})

  it('should create', () => {
    const e = new SimpleEngine()
    expect(e).toBeTruthy()
  })

  describe('HomeInference', () => {
    it('should not infer for 0 points', async () => {
      const t = new InferenceTestCase(
        fixtures.trajectoryEmpty,
        [HomeInference],
        []
      )
      await t.test(new SimpleEngine())
    })

    it('should not infer for mobile only trajectory', async () => {
      const t = new InferenceTestCase(
        fixtures.trajectoryMobileOnly,
        [HomeInference],
        []
      )
      await t.test(new SimpleEngine())
    })

    it('should infer for home-work data', async () => {
      const t = new InferenceTestCase(
        fixtures.trajectoryHomeWork,
        [HomeInference],
        [fixtures.trajectoryHomeResult]
      )
      await t.test(new SimpleEngine())
    })

    it('should infer for spatially dense data', async () => {
      const t = new InferenceTestCase(
        fixtures.trajectoryHomeWorkSpatiallyDense,
        [HomeInference],
        [fixtures.trajectoryHomeResult]
      )
      await t.test(new SimpleEngine())
    })

    it('should infer for temporally sparse data', async () => {
      const t = new InferenceTestCase(
        fixtures.trajectoryHomeWorkTemporallySparse,
        [HomeInference],
        [fixtures.trajectoryHomeResult]
      )
      await t.test(new SimpleEngine())
    })

    // TODOs
    it('should infer with low confidence for low stationary point count', () => {})

    it('should infer with low confidence for low total point count', () => {})

    it('should infer for single night location', () => {})

    it('should infer with low confidence for 2 different night locations', () => {})

    it('should infer for realworld data (1 day)', () => {})

    it('should infer for realworld data (1 year)', () => {})
  })

  describe('WorkInference', () => {
    // TODO: migrate from HomeInference, once done

    it('should not infer for 0 points', async () => {
      const t = new InferenceTestCase(
        fixtures.trajectoryEmpty,
        [WorkInference],
        []
      )
      await t.test(new SimpleEngine())
    })

    it('should not infer for mobile only trajectory', async () => {
      const t = new InferenceTestCase(
        fixtures.trajectoryMobileOnly,
        [WorkInference],
        []
      )
      await t.test(new SimpleEngine())
    })

    it('should infer for home-work data', async () => {
      const t = new InferenceTestCase(
        fixtures.trajectoryHomeWork,
        [WorkInference],
        [fixtures.trajectoryWorkResult]
      )
      await t.test(new SimpleEngine())
    })

    it('should infer for spatially dense data', async () => {
      const t = new InferenceTestCase(
        fixtures.trajectoryHomeWorkSpatiallyDense,
        [WorkInference],
        [fixtures.trajectoryWorkResult]
      )
      await t.test(new SimpleEngine())
    })

    it('should infer for temporally sparse data', async () => {
      const t = new InferenceTestCase(
        fixtures.trajectoryHomeWorkTemporallySparse,
        [WorkInference],
        [fixtures.trajectoryWorkResult]
      )
      await t.test(new SimpleEngine())
    })
  })
})

class InferenceTestCase {
  constructor(
    public trajectoryData: TrajectoryData,
    public inferences: InferenceDefinition[],
    public expected: InferenceResultTest[],
    public deltaMeters: number = 50
  ) {}

  async test(e: IInferenceEngine): Promise<Inference[]> {
    const meta: TrajectoryMeta = {
      id: 'test',
      placename: 'test-place',
      type: TrajectoryType.USERTRACK,
      durationDays: null,
    }
    const trajectory = new Trajectory(meta, this.trajectoryData)
    const result = await e.infer(trajectory, this.inferences)
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
      const dist = computeHaversineDistance(expectation.location, r.latLng)
      expect(dist).toBeLessThanOrEqual(
        this.deltaMeters,
        `'${r.name}' location didn't match`
      )
    }

    return result.inferences
  }
}

function computeHaversineDistance(
  firstCoordinate: [number, number],
  secondCoordinate: [number, number]
) {
  const a = { latitude: firstCoordinate[0], longitude: firstCoordinate[1] }
  const b = { latitude: secondCoordinate[0], longitude: secondCoordinate[1] }
  return haversine(a, b)
}

type InferenceResultTest = {
  name: string
  location: LatLngTuple
}
