import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { combineLatest, from, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import {
  Point,
  Trajectory,
  TrajectoryMeta,
  TrajectoryType,
} from '../model/trajectory'
import { SqliteService } from './db/sqlite.service'

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
  constructor(private http: HttpClient, private db: SqliteService) {}

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

  getFullUserTrack(): Observable<Trajectory> {
    if (!this.db.isSupported()) return from(Promise.resolve(undefined))
    return from(this.db.getFullTrajectory(Trajectory.trackingTrajectoryID))
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
        return new Observable<Trajectory>((subscriber) => {
          this.db.getFullTrajectory(id).then((trajectory) => {
            // publish trajectory
            subscriber.next(trajectory)

            // subscribe to addPoint events
            const inner = this.db.addPointSub.subscribe(async (point) => {
              // add new point to trajectory and publish it
              trajectory.addPoint(point)
              subscriber.next(trajectory)
            })

            // add inner subscription to add tear down for unsubscribe()
            subscriber.add(inner)
          })
        })
    }
  }

  addTrajectory(t: Trajectory) {
    return this.db.upsertTrajectory(t)
  }

  deleteTrajectory(t: TrajectoryMeta) {
    return this.db.deleteTrajectory(t)
  }

  addPoint(trajectoryId: string, p: Point) {
    return this.db.upsertPoint(trajectoryId, p)
  }
}
