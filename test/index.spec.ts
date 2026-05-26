import { expect } from 'aegir/chai'
import { base32 } from 'multiformats/bases/base32'
import { base36 } from 'multiformats/bases/base36'
import { base58btc } from 'multiformats/bases/base58'
import { base64 } from 'multiformats/bases/base64'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import debug from 'weald'
import { format } from 'weald/format'
import { disable, enable, logger } from '../src/index.ts'

describe('logger', () => {
  afterEach(() => {
    disable()
  })

  it('creates a logger', () => {
    const log = logger('hello')

    expect(log).to.be.a('function')
    expect(log).to.have.property('enabled').that.is.not.true()
    expect(log).to.have.property('error').that.is.a('function')
    expect(log).to.have.nested.property('error.enabled').that.is.not.true()
    expect(log).to.have.property('trace').that.is.a('function')
    expect(log).to.have.nested.property('trace.enabled').that.is.not.true()
  })

  it('creates a logger with logging enabled', () => {
    debug.enable('enabled-logger')

    const log = logger('enabled-logger')

    expect(log).to.be.a('function')
    expect(log).to.have.property('enabled').that.is.true()
    expect(log).to.have.property('error').that.is.a('function')
    expect(log).to.have.nested.property('error.enabled').that.is.not.true()
    expect(log).to.have.property('trace').that.is.a('function')
    expect(log).to.have.nested.property('trace.enabled').that.is.not.true()
  })

  it('creates a logger with logging and errors enabled', () => {
    debug.enable('enabled-with-error-logger*')

    const log = logger('enabled-with-error-logger')

    expect(log).to.be.a('function')
    expect(log).to.have.property('enabled').that.is.true()
    expect(log).to.have.property('error').that.is.a('function')
    expect(log).to.have.nested.property('error.enabled').that.is.true()
    expect(log).to.have.property('trace').that.is.a('function')
    expect(log).to.have.nested.property('trace.enabled').that.is.not.true()
  })

  it('creates a logger with trace enabled', () => {
    debug.enable('enabled-with-trace-logger*,*:trace')

    const log = logger('enabled-with-trace-logger')

    expect(log).to.be.a('function')
    expect(log).to.have.property('enabled').that.is.true()
    expect(log).to.have.property('error').that.is.a('function')
    expect(log).to.have.nested.property('error.enabled').that.is.true()
    expect(log).to.have.property('trace').that.is.a('function')
    expect(log).to.have.nested.property('trace.enabled').that.is.true()
  })

  it('creates a sub logger', () => {
    debug.enable('enabled-with-trace-logger*,*:trace')

    const log = logger('enabled-with-trace-logger')
    const subLog = log.newScope('sub-component')

    expect(subLog).to.be.a('function')
    expect(subLog).to.have.property('enabled').that.is.true()
    expect(subLog).to.have.property('error').that.is.a('function')
    expect(subLog).to.have.nested.property('error.enabled').that.is.true()
    expect(subLog).to.have.property('trace').that.is.a('function')
    expect(subLog).to.have.nested.property('trace.enabled').that.is.true()
  })

  it('has multibase formatters', () => {
    debug.enable('enabled-with-formatters')

    expect(debug.formatters).to.have.property('z').that.is.a('function')
    expect(debug.formatters).to.have.property('b').that.is.a('function')
    expect(debug.formatters).to.have.property('k').that.is.a('function')
    expect(debug.formatters).to.have.property('m').that.is.a('function')
  })

  it('test base58 formatter', () => {
    const buf = uint8ArrayFromString('12D3KooWEtDzsSCKKhvHz2k2nTgDUY9eUne9as6XB7Az2ftekLZJ', 'base58btc')

    expect(debug.formatters.z(buf)).to.equal(base58btc.baseEncode(buf))
  })

  it('test base32 formatter', () => {
    const buf = uint8ArrayFromString('jbswy3dpfqqho33snrscc===', 'base32')

    expect(debug.formatters.b(buf)).to.equal(base32.baseEncode(buf))
  })

  it('test base36 formatter', () => {
    const buf = uint8ArrayFromString('jbswy3dpfqqho33snrscc===', 'base32')

    expect(debug.formatters.k(buf)).to.equal(base36.baseEncode(buf))
  })

  it('test base64 formatter', () => {
    const buf = uint8ArrayFromString('jbswy3dpfqqho33snrscc===', 'base32')

    expect(debug.formatters.m(buf)).to.equal(base64.baseEncode(buf))
  })

  it('collects logs', () => {
    enable('*,*:trace')
    debug.useColors = () => false

    const logs: any[] = []
    const log = logger('hello', {
      onLog (...args) {
        logs.push(format(...args))
      }
    })

    log('hello world')
    log.error('oh no')
    log.trace('shh')

    const scope = log.newScope('new-scope')
    scope('hello world')
    scope.error('oh no')
    scope.trace('shh')

    expect(logs).to.have.lengthOf(6)
  })
})
