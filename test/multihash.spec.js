import { Piece } from '@web3-storage/data-segment'
import { deriveBuffer } from './util.js'
import { parse as parseLink } from 'multiformats/link'
import * as Hasher from '../src/multihash.js'

/**
 * Module is generated from `./commp.csv` using prepare script.
 * @see https://github.com/hugomrdias/playwright-test/issues/544
 */
import vector from './commp/vector.js'

/**
 * @type {import("entail").Suite}
 */
export const testMultihash = {
  'throws if payload as less than minimum allowed': async (assert) => {
    const payload = deriveBuffer(64)
    let result = null
    try {
      result = await Hasher.digest(payload)
    } catch (error) {
      result = error
    }

    assert.ok(
      String(result).includes('not defined for payloads smaller than 65 bytes')
    )
  },
  ...Object.fromEntries(
    Object.values(vector).map((data) => [
      `${data.in.contentSize}\t\t${data.in.cid}`,
      async (assert) => {
        const payload = deriveBuffer(data.in.contentSize)
        const root = parseLink(data.out.cid).multihash.digest
        const height = Piece.PaddedSize.toHeight(BigInt(data.out.paddedSize))

        {
          const digest = Hasher.digest(payload)
          assert.deepEqual(digest.root, root)
          assert.deepEqual(digest.code, 0x1011)
          assert.deepEqual(
            digest.name,
            'fr32-sha2-256-trunc254-padded-binary-tree'
          )
          assert.deepEqual(digest.size, 33)
          assert.deepEqual(digest.height, height)
        }

        const hasher = Hasher.create()
        // do the chunked write
        {
          const offset = Math.floor(Math.random() * payload.byteLength)
          hasher.write(payload.subarray(0, offset))
          assert.deepEqual(hasher.count(), BigInt(offset))
          hasher.write(new Uint8Array())
          assert.deepEqual(hasher.count(), BigInt(offset))
          hasher.write(payload.subarray(offset))
          assert.deepEqual(hasher.count(), BigInt(payload.byteLength))

          assert.deepEqual(hasher.code, 0x1011)
          assert.deepEqual(hasher.size, 33)
          assert.deepEqual(
            hasher.name,
            'fr32-sha2-256-trunc254-padded-binary-tree'
          )

          const digest = hasher.digest()
          assert.deepEqual(digest.root, root)
          assert.deepEqual(digest.root, root)
          assert.deepEqual(digest.code, 0x1011)
          assert.deepEqual(
            digest.name,
            'fr32-sha2-256-trunc254-padded-binary-tree'
          )
          assert.deepEqual(digest.size, 33)
          assert.deepEqual(digest.height, height)
        }

        // reset and retry
        hasher.reset()
        {
          assert.deepEqual(hasher.count(), 0n)
          const digest = hasher.write(payload).digest()
          assert.deepEqual(digest.root, root)
          assert.deepEqual(digest.height, height)
          assert.deepEqual(hasher.count(), BigInt(payload.byteLength))
        }
      },
    ])
  ),
}
