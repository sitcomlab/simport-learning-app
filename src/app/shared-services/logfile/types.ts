/**
 * @description What happens in the log event?
 */
export enum LogEventType {
  start = 'start',
  stop = 'stop',
  click = 'click',
  change = 'change',
  active = 'active',
  inactive = 'inactive',
  other = 'other',
}

/**
 * @description In which scope does the log event happen?
 */
export enum LogEventScope {
  app = 'app',
  tracking = 'tracking',
  inference = 'inference',
  other = 'other',
}

/**
 * @description Log level
 */
export enum LogEventLevel {
  info = 'info',
  warn = 'warn',
  error = 'error',
}
