# birnam

[![codecov](https://img.shields.io/codecov/c/github/achingbrain/birnam.svg?style=flat-square)](https://codecov.io/gh/achingbrain/birnam)
[![CI](https://img.shields.io/github/actions/workflow/status/achingbrain/birnam/js-test-and-release.yml?branch=main\&style=flat-square)](https://github.com/achingbrain/birnam/actions/workflows/js-test-and-release.yml?query=branch%3Amain)

> Component-based logging for interplanetary applications

# About

<!--

!IMPORTANT!

Everything in this README between "# About" and "# Install" is automatically
generated and will be overwritten the next time the doc generator is run.

To make changes to this section, please update the @packageDocumentation section
of src/index.js or src/index.ts

To experiment with formatting, please run "npm run docs" from the root of this
repo and examine the changes made.

-->

A logger based on [weald](https://www.npmjs.com/package/weald) that contains custom formatters binary data in common multibase formats - base58btc, base32, base36 and base64 - all other logged objects ([CID](https://docs.ipfs.tech/concepts/content-addressing/)s, [Multiaddrs](https://multiformats.io/multiaddr/), etc) should contain a suitable `toString()` method.

## Example

```TypeScript
import { logger } from 'birnam'

const log = logger('helia:my:component:name')

try {
  // an operation
  log('something happened: %s', 'it was ok')
} catch (err) {
  log.error('something bad happened: %e', err)
}

log('with this peer: %s', {
  toString () {
    return '12D3Foo'
  }
})
log('and this base58btc: %z', Uint8Array.from([0, 1, 2, 3]))
log('and this base32: %b', Uint8Array.from([4, 5, 6, 7]))
```

```console
$ DEBUG=helia:* node index.js
something happened: it was ok
something bad happened: <stack trace>
with this peer: 12D3Foo
with this base58btc: zQmfoo
with this base32: bafyfoo
```

## What's in a name?

Great Birnam Wood is referenced in Shakespeare's [Scottish play](https://en.wikipedia.org/wiki/The_Scottish_Play)
as part of the prophecy told by the three witches. The woods themselves have
largely been cut down since, and the trees (presumably) turned into logs.

# Install

```console
$ npm i birnam
```

## Browser `<script>` tag

Loading this module through a script tag will make its exports available as `Birnam` in the global namespace.

```html
<script src="https://unpkg.com/birnam/dist/index.min.js"></script>
```

# API Docs

- <https://achingbrain.github.io/birnam>

# License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](https://github.com/achingbrain/birnam/LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](https://github.com/achingbrain/birnam/LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

# Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
