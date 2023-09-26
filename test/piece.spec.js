import { Piece, Node } from '@web3-storage/data-segment'
import { deriveBuffer } from './util.js'
import * as SHA256 from 'sync-multihash-sha2/sha256'
import * as raw from 'multiformats/codecs/raw'
import * as API from '@web3-storage/data-segment'
import { create as createLink, parse as parseLink } from 'multiformats/link'

/**
 * Module is generated from `./commp.csv` using prepare script.
 * @see https://github.com/hugomrdias/playwright-test/issues/544
 */
import vector from './commp/vector.js'
import { PaddedSize } from '../src/piece.js'

/**
 * @type {import("entail").Suite}
 */
export const testPiece = {
  'size shorter than allowed': async (assert) => {
    const source = deriveBuffer(64)
    let result = null
    try {
      result = await Piece.fromPayload(source)
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
        const source = deriveBuffer(data.in.contentSize)
        const root = SHA256.digest(raw.encode(source))
        const link = createLink(raw.code, root)
        const piece = await Piece.fromPayload(source)
        assert.deepEqual(link.toString(), data.in.cid, 'same source content')
        assert.deepEqual(piece.root, parseLink(data.out.cid).multihash.digest)
        assert.deepEqual(parseLink(data.out.cid), piece.toInfo().link)
        assert.deepEqual(piece.size, BigInt(data.out.size))
        assert.deepEqual(piece.height, Math.log2(data.out.size / Node.Size))
        // assert.deepEqual(piece.paddedSize, data.out.paddedSize)
      },
    ])
  ),

  'toString <-> fromString': async (assert) => {
    const source = deriveBuffer(128)
    const piece = await Piece.fromPayload(source)

    const serialized = piece.toString()
    assert.deepEqual(piece.link.toString(), serialized)

    const deserialized = Piece.fromString(serialized)
    assert.deepEqual(deserialized.link.toString(), piece.link.toString())
    assert.deepEqual(deserialized.size, piece.size)
    assert.deepEqual(deserialized.height, piece.height)
  },

  'fromLink throws on invalid encoding': async (assert) => {
    assert.throws(
      () =>
        Piece.fromLink(
          parseLink(
            'baga6ea4seaqcq4xx7rqx2lsrm6iky7qqk5jh7pbaj5bgdu22afhp4fodvccb6bq'
          )
        ),
      /raw encoding/
    )
  },
  'fromLink throws on invalid multihash': async (assert) => {
    assert.throws(
      () =>
        Piece.fromLink(
          parseLink(
            'bafkreie3ntx3nzvhuv63btdsgaeste6gurdigzw2soryitq6m3f3p24nba'
          )
        ),
      /must have fr32-sha2-256-trunc254-padded-binary-tree multihash/
    )
  },

  'test PieceInfo View': async (assert) => {
    const size = 8192n
    const height = 8
    /** @type {API.LegacyPieceLink} */
    const legacyLink = parseLink(
      'baga6ea4seaqidthc6vofh2jqtu4lcg5ptuuqcsgzzlcq4ilafyjfixdfbhpnoda'
    )
    const piece = Piece.fromInfo({
      link: legacyLink,
      size: PaddedSize.from(size),
    })

    const info = piece.toInfo()
    assert.deepEqual(info.height, height)
    assert.deepEqual(info.size, size)

    assert.deepEqual(JSON.parse(JSON.stringify(info)), {
      link: { '/': legacyLink.toString() },
      height,
    })
    assert.deepEqual(`${info}`, JSON.stringify(info, null, 2))
  },
}
