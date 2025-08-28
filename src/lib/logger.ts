export type LogArgs = unknown[]

const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV

export const logger = {
  debug: (...args: LogArgs) => {
    if (isDev) console.debug(...args)
  },
  info: (...args: LogArgs) => {
    if (isDev) console.info(...args)
  },
  warn: (...args: LogArgs) => {
    console.warn(...args)
  },
  error: (...args: LogArgs) => {
    console.error(...args)
  },
}
