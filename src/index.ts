/**
 * @packageDocumentation
 *
 * A logger based on [weald](https://www.npmjs.com/package/weald) that contains custom formatters binary data in common multibase formats - base58btc, base32, base36 and base64 - all other logged objects ([CID](https://docs.ipfs.tech/concepts/content-addressing/)s, [Multiaddrs](https://multiformats.io/multiaddr/), etc) should contain a suitable `toString()` method.
 *
 * @example
 *
 * ```TypeScript
 * import { logger } from 'birnam'
 *
 * const log = logger('helia:my:component:name')
 *
 * try {
 *   // an operation
 *   log('something happened: %s', 'it was ok')
 * } catch (err) {
 *   log.error('something bad happened: %e', err)
 * }
 *
 * log('with this peer: %s', {
 *   toString () {
 *     return '12D3Foo'
 *   }
 * })
 * log('and this base58btc: %z', Uint8Array.from([0, 1, 2, 3]))
 * log('and this base32: %b', Uint8Array.from([4, 5, 6, 7]))
 * ```
 *
 * ```console
 * $ DEBUG=helia:* node index.js
 * something happened: it was ok
 * something bad happened: <stack trace>
 * with this peer: 12D3Foo
 * with this base58btc: zQmfoo
 * with this base32: bafyfoo
 * ```
 *
 * ## What's in a name?
 *
 * Great Birnam Wood is referenced in Shakespeare's [Scottish play](https://en.wikipedia.org/wiki/The_Scottish_Play)
 * as part of the prophecy told by the three witches. The woods themselves have
 * largely been cut down since, and the trees (presumably) turned into logs.
 */

import { base32 } from 'multiformats/bases/base32'
import { base36 } from 'multiformats/bases/base36'
import { base58btc } from 'multiformats/bases/base58'
import { base64 } from 'multiformats/bases/base64'
import debug from 'weald'
import type { Options as LoggerOptions, Debugger } from 'weald'

/**
 * Logger component for interplanetary applications
 */
export interface Logger {
  /**
   * Log a message
   */
  (formatter: any, ...args: any[]): void

  /**
   * Log an error message
   */
  error(formatter: any, ...args: any[]): void

  /**
   * Log a trace message
   */
  trace(formatter: any, ...args: any[]): void

  /**
   * `true` if this logger is enabled
   */
  enabled: boolean

  /**
   * Create a logger scoped below this one
   *
   * @example
   *
   * ```ts
   * import { defaultLogger } from 'birnam'
   *
   * const log = defaultLogger().forComponent('foo')
   *
   * log('hello')
   * // foo hello
   *
   * const subLog = log.newScope('bar')
   *
   * subLog('hello')
   * // foo:bar hello
   * ```
   */
  newScope(name: string): Logger
}

/**
 * Component based logger. This can be used to create loggers that are scoped to
 * individual system components or services.
 *
 * To see logs, run your app with `DEBUG` set as an env var or for browsers, in
 * `localStorage`:
 *
 * ```console
 * $ DEBUG=helia* node index.js
 *  helia:my-service hello +0ms
 * ```
 */
export interface ComponentLogger {
  /**
   * Returns a logger for the specified component.
   *
   * @example
   *
   * ```TypeScript
   * import type { ComponentLogger, Logger } from 'birnam'
   *
   * interface MyServiceComponents {
   *   logger: ComponentLogger
   * }
   *
   * class MyService {
   *   private readonly log: Logger
   *
   *   constructor (components) {
   *     this.log = components.logger.forComponent('my-app:my-service')
   *
   *     this.log('hello')
   *     // logs:
   *     // my-app:my-service hello +0ms
   *   }
   * }
   * ```
   */
  forComponent(name: string): Logger
}

export type { LoggerOptions }

// Add a formatter for converting to a base58 string
debug.formatters.z = (v?: Uint8Array): string => {
  return v == null ? 'undefined' : base58btc.baseEncode(v)
}

// Add a formatter for converting to a base32 string
debug.formatters.b = (v?: Uint8Array): string => {
  return v == null ? 'undefined' : base32.baseEncode(v)
}

// Add a formatter for converting to a base36 string
debug.formatters.k = (v?: Uint8Array): string => {
  return v == null ? 'undefined' : base36.baseEncode(v)
}

// Add a formatter for converting to a base64 string
debug.formatters.m = (v?: Uint8Array): string => {
  return v == null ? 'undefined' : base64.baseEncode(v)
}

// Add a formatter for stringifying Errors
debug.formatters.e = (v?: Error): string => {
  if (v == null) {
    return 'undefined'
  }

  return printError(v)
}

function formatError (v: Error, indent = ''): string {
  const message = notEmpty(v.message)
  const stack = notEmpty(v.stack)

  // some browser errors (mostly from Firefox) have no message or no stack,
  // sometimes both, sometimes neither. Sometimes the message is in the stack,
  // sometimes is isn't so try to do *something* useful
  if (message != null && stack != null) {
    if (stack.includes(message)) {
      return `${stack.split('\n').join(`\n${indent}`)}`
    }

    return `${message}\n${indent}${stack.split('\n').join(`\n${indent}`)}`
  }

  if (stack != null) {
    return `${stack.split('\n').join(`\n${indent}`)}`
  }

  if (message != null) {
    return `${message}`
  }

  return `${v.toString()}`
}

function isAggregateError (err?: any): err is AggregateError {
  return err instanceof AggregateError || (err?.name === 'AggregateError' && Array.isArray(err.errors))
}

function printError (err: Error, indent = ''): string {
  if (isAggregateError(err)) {
    let output = formatError(err, indent)

    if (err.errors.length > 0) {
      indent = `${indent}    `

      output += `\n${indent}${
        err.errors
        .map(err => `${printError(err, `${indent}`)}`)
        .join(`\n${indent}`)
      }`
    } else {
      output += `\n${indent}[Error list was empty]`
    }

    return output.trim()
  }

  return formatError(err, indent)
}

function createDisabledLogger (namespace: string): Debugger {
  const logger = (): void => {}
  logger.enabled = false
  logger.color = ''
  logger.diff = 0
  logger.log = (): void => {}
  logger.namespace = namespace
  logger.destroy = () => true
  logger.extend = () => logger
  logger.useColors = () => false

  return logger
}

/**
 * Create a component logger that will prefix any log messages with the passed
 * string.
 *
 * @example
 *
 * ```TypeScript
 * import { prefixLogger } from 'birnam'
 *
 * const logger = prefixLogger('my-node')
 *
 * const log = logger.forComponent('my-component')
 * log.info('hello world')
 * // logs "my-node:my-component hello world"
 * ```
 */
export function prefixLogger (prefix: string, options?: LoggerOptions): ComponentLogger {
  return {
    forComponent (name: string) {
      return logger(`${prefix}:${name}`, options)
    }
  }
}

/**
 * Create a component logger
 *
 * @example
 *
 * ```TypeScript
 * import { defaultLogger } from 'birnam'
 *
 * const logger = defaultLogger()
 *
 * const log = logger.forComponent('my-component')
 * log.info('hello world')
 * // logs "my-component hello world"
 * ```
 */
export function defaultLogger (options?: LoggerOptions): ComponentLogger {
  return {
    forComponent (name: string) {
      return logger(name, options)
    }
  }
}

/**
 * Creates a logger for the passed component name.
 *
 * @example
 *
 * ```TypeScript
 * import { logger } from 'birnam'
 *
 * const log = logger('my-component')
 * log.info('hello world')
 * // logs "my-component hello world"
 * ```
 */
export function logger (name: string, options?: LoggerOptions): Logger {
  // trace logging is a no-op by default
  let trace = createDisabledLogger(`${name}:trace`)

  // look at all the debug names and see if trace logging has explicitly been enabled
  if (debug.enabled(`${name}:trace`) && debug.names.map((r: any) => r.toString()).find((n: string) => n.includes(':trace')) != null) {
    trace = debug(`${name}:trace`, options)
  }

  return Object.assign(debug(name, options), {
    error: debug(`${name}:error`, options),
    trace,
    newScope: (scope: string) => logger(`${name}:${scope}`, options)
  })
}

export function disable (): void {
  debug.disable()
}

export function enable (namespaces: string): void {
  debug.enable(namespaces)
}

export function enabled (namespaces: string): boolean {
  return debug.enabled(namespaces)
}

function notEmpty (str?: string): string | undefined {
  if (str == null) {
    return
  }

  str = str.trim()

  if (str.length === 0) {
    return
  }

  return str
}
