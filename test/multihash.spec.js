import { Piece } from '@web3-storage/data-segment'
import { deriveBuffer } from './util.js'
import { parse as parseLink } from 'multiformats/link'
import * as Hasher from '../src/multihash.js'
import * as Uint64 from '../src/uint64.js'

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
  'RFC test case 1': async (assert) => {
    const part = 127
    const payload = new Uint8Array(part * 4)
    payload.fill(0, 0 * part, 1 * part)
    payload.fill(1, 1 * part, 2 * part)
    payload.fill(2, 2 * part, 3 * part)
    payload.fill(3, 3 * part)

    const v1 = parseLink(
      'baga6ea4seaqes3nobte6ezpp4wqan2age2s5yxcatzotcvobhgcmv5wi2xh5mbi'
    )
    const v2 = parseLink(
      `bafkzcibbarew3lqmzhrgl37fuadoqbrguxofyqe6luyvlqjzqtfpnsgvz7lak`
    )

    const digest = Hasher.digest(payload)
    assert.deepEqual(digest.root, v1.multihash.digest)
    assert.deepEqual(digest.bytes, v2.multihash.bytes)
    assert.deepEqual(v2.toString(), Piece.fromDigest(digest).link.toString())
  },

  'RFC test case 2': async (assert) => {
    const v1 = parseLink(
      'baga6ea4seaqao7s73y24kcutaosvacpdjgfe5pw76ooefnyqw4ynr3d2y6x2mpq'
    )
    const v2 = parseLink(
      `bafkzcibbdydx4x66gxcqveyduviaty2jrjhl5x7ttrbloefxgdmoy6whv6td4`
    )
    // Empty 32 GiB piece
    const height = Piece.PaddedSize.toHeight(Uint64.pow2(35n))
    const digest = Hasher.digest(new Uint8Array(127))
    const { bytes } = digest
    bytes.set(v1.multihash.digest, bytes.length - v1.multihash.digest.length)
    bytes[bytes.length - v1.multihash.digest.length - 1] = height

    assert.equal(digest.height, height)
    assert.equal(v2.toString(), Piece.fromDigest(digest).link.toString())
  },
  'RFC test case 3': async (assert) => {
    const v1 = parseLink(
      'baga6ea4seaqomqafu276g53zko4k23xzh4h4uecjwicbmvhsuqi7o4bhthhm4aq'
    )
    const v2 = parseLink(
      `bafkzcibbd7teabngx7rxo6ktxcww56j7b7fbasnsaqlfj4vech3xaj4zz3hae`
    )
    // Empty 32 GiB piece
    const height = Piece.PaddedSize.toHeight(Uint64.pow2(36n))

    const digest = Hasher.digest(new Uint8Array(127))
    const { bytes } = digest
    bytes.set(v1.multihash.digest, bytes.length - v1.multihash.digest.length)
    bytes[bytes.length - v1.multihash.digest.length - 1] = height

    assert.equal(digest.height, height)
    assert.equal(v2.toString(), Piece.fromDigest(digest).link.toString())
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
