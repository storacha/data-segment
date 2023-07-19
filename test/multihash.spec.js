import { Piece, Node } from '@web3-storage/data-segment'
import { deriveBuffer } from './util.js'
import * as SHA256 from 'sync-multihash-sha2/sha256'
import * as raw from 'multiformats/codecs/raw'
import { create as createLink, parse as parseLink } from 'multiformats/link'
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
  // 'multihash for 65': async (assert) => {
  //   const payload = deriveBuffer(65)

  //   assert.deepEqual(Hasher.digest(payload), expect(payload))
  // },

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

        // const piece = Hasher.digest(payload)
        // assert.deepEqual(link.toString(), data.in.cid, 'same source content')
        // assert.deepEqual(
        //   piece.tree.root,
        //   parseLink(data.out.cid).multihash.digest
        // )
        // assert.deepEqual(parseLink(data.out.cid), piece.link)
        // assert.deepEqual(piece.size, BigInt(data.out.size))
        // assert.deepEqual(piece.height, Math.log2(data.out.size / Node.Size))
        // assert.deepEqual(piece.paddedSize, data.out.paddedSize)

        // const json = piece.toJSON()

        // assert.deepEqual(json, {
        //   link: {
        //     '/': data.out.cid,
        //   },
        //   height: Math.log2(data.out.size / Node.Size),
        // })

        // const view = Piece.fromJSON(json)
        // assert.deepEqual(view.link, piece.link)
        // assert.deepEqual(view.size, piece.size)
        // assert.deepEqual(view.height, piece.height)
      },
    ])
  ),
}

/**
 * @param {Uint8Array} payload
 */
const expect = (payload) => Piece.build(payload).tree.root
