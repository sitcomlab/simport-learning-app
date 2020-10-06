import { TestBed } from '@angular/core/testing';

import { TrajectoryService } from './trajectory.service';

describe('TrajectoryService', () => {
  let service: TrajectoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrajectoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
