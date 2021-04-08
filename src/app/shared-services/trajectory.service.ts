import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { combineLatest, from, merge, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import {
  Point,
  Trajectory,
  TrajectoryMeta,
  TrajectoryType,
} from '../model/trajectory'
import { SqliteService } from './db/sqlite.service'
import { LocationService } from './location.service'

/**
 * TrajectoryService provides access to persisted Trajectories.
 * There are different persistence mechanisms to support most platforms:
 * Example trajectories are stored as JSON under src/assets/trajectories
 * and can be loaded readonly on any platform.
 * On mobile platforms, writable storage is available via SQLite, where
 * user-provided trajectories can be stored & retrieved.
 *
 * The highlevel API aims to unify/hide these persistence mechanisms, throwing
 * errors if not available on the current platform.
 */
@Injectable()
export class TrajectoryService {
  constructor(
    private http: HttpClient,
    private db: SqliteService,
    private locationService: LocationService
  ) {}

  // Returns an observable yielding metadata of all available trajectories
  getAllMeta(): Observable<TrajectoryMeta[]> {
    // yield on each source update, once all sources have yielded once.
    return combineLatest([this.getReadonlyMeta(), this.getWritableMeta()]).pipe(
      map((val) => [].concat(...val)) // flatten result arrays
    )
  }

  // Returns metadata of all trajectories stored in the (writable) database
  getWritableMeta(): Observable<TrajectoryMeta[]> {
    if (!this.db.isSupported()) return from(Promise.resolve([]))
    // TODO: make this reactive on DB updates/inserts..?
    return from(this.db.getAllTrajectoryMeta())
  }

  // returns metadata of all included example (readonly) trajectories
  getReadonlyMeta(): Observable<TrajectoryMeta[]> {
    return this.http.get<TrajectoryMeta[]>('assets/trajectories/index.json')
  }

  // Returns any trajectory data by slug. slug consists of `type/id`.
  // TODO: catch 404 properly?
  getOne(type: TrajectoryType, id: string): Observable<Trajectory> {
    switch (type) {
      case TrajectoryType.EXAMPLE:
        const getData = this.http
          .get<{ coordinates: string; timestamps: number[]; time0: string }>(
            `assets/trajectories/${id}.json`
          )
          .pipe(map(Trajectory.fromJSON))

        const getMeta = this.http
          .get<TrajectoryMeta[]>('assets/trajectories/index.json')
          .pipe(map((ts) => ts.find((t) => t.id === id)))

        return combineLatest([getMeta, getData]).pipe(
          map(([meta, data]) => new Trajectory(meta, data))
        )

      default:
        const ob = new Observable<Trajectory>((s) => {
          this.db.addPointSub.subscribe(async () => {
            s.next(await this.db.getFullTrajectory(id))
          })
        })

        return merge(from(this.db.getFullTrajectory(id)), ob)
    }
  }

  addTrajectory(t: Trajectory) {
    return this.db.upsertTrajectory(t)
  }

  deleteTrajectory(t: TrajectoryMeta) {
    this.locationService.stop()
    return this.db.deleteTrajectory(t)
  }

  addPoint(trajectoryId: string, p: Point) {
    return this.db.upsertPoint(trajectoryId, p)
  }
}
