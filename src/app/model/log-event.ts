import {
  LogEventType,
  LogEventScope,
  LogEventLevel,
} from '../shared-services/logfile/types'

export class LogEvent {
  constructor(
    public type: LogEventType,
    public scope: LogEventScope,
    public level: LogEventLevel,
    public text: string,
    public timestamp: Date,
    public locationCount: number,
    public lastLocationTimestamp: Date
  ) {}

  static fromJSON({
    type,
    scope,
    level,
    text,
    timestamp,
    locationCount,
    lastLocationTimestamp,
  }) {
    return new LogEvent(
      type,
      scope,
      level,
      text,
      timestamp,
      locationCount,
      lastLocationTimestamp
    )
  }
}
