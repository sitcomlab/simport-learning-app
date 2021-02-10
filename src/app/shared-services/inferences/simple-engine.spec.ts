import { async } from '@angular/core/testing'
import { SimpleEngine } from './simple-engine'

describe('inferences/SimpleEngine', () => {
  beforeEach(async(() => {}))

  it('should create', () => {
    const e = new SimpleEngine()
    expect(e).toBeTruthy()
  })
})
