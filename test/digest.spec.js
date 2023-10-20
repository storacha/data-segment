import { Piece } from '@web3-storage/data-segment'
import { deriveBuffer } from './util.js'
import { parse as parseLink } from 'multiformats/link'
import * as Hasher from '../src/multihash.js'
import * as Digest from '../src/digest.js'
import * as Uint64 from '../src/uint64.js'
import * as Link from 'multiformats/link'
import * as Raw from 'multiformats/codecs/raw'
import { varint } from 'multiformats'

const prefix = varint.encodeTo(
  Hasher.code,
  new Uint8Array(varint.encodingLength(Hasher.code))
)

/**
 * Module is generated from `./commp.csv` using prepare script.
 * @see https://github.com/hugomrdias/playwright-test/issues/544
 */
import vector from './commp/vector.js'

/**
 * @type {import("entail").Suite}
 */
export const testDigest = {
  testInvalidCode: async (assert) => {
    const digest = Hasher.digest(new Uint8Array(0))
    const bytes = digest.bytes.slice()
    varint.encodeTo(Digest.code + 1, bytes)

    assert.throws(() => Digest.fromBytes(bytes), /Expected multihash with code/)
  },

  testInvalidSize: async (assert) => {
    const digest = Hasher.digest(new Uint8Array(0))
    const bytes = new Uint8Array([...digest.bytes, 1, 2])
    const offset = varint.encodingLength(Digest.code)

    assert.throws(
      () => Digest.fromBytes(bytes),
      new RegExp(
        `Invalid multihash size expected ${digest.bytes.length} bytes, got ${bytes.length} bytes`
      )
    )
  },
}
