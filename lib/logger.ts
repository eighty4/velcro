type LogFn = (...args: any[]) => void

export interface Logger {
    log: LogFn
}

export class ConsoleLogger implements Logger {
    log: LogFn = console.log.bind(null)
}
