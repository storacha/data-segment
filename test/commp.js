import { CommP } from '@web3-storage/data-segment'
import { deriveBuffer } from './util.js'
import { sha256 } from 'multiformats/hashes/sha2'
import * as raw from 'multiformats/codecs/raw'
import { create as createLink } from 'multiformats/link'

/**
 * Module is generated from `./commp.csv` using prepare script.
 * @see https://github.com/hugomrdias/playwright-test/issues/544
 */
import vector from './commp/vector.csv.js'

/**
 * @type {import("./api.js").TestSuite}
 */
export const test = Object.fromEntries(
  Object.values(vector).map((data) => [
    `size: ${data.in.size}\t\t${data.in.cid}`,
    async (assert) => {
      const source = await deriveBuffer(data.in.size)
      const link = createLink(raw.code, await sha256.digest(raw.encode(source)))
      const commP = await CommP.build(source)
      assert.deepEqual(link.toString(), data.in.cid, 'same source content')

      assert.deepEqual(commP.toJSON(), {
        link: {
          '/': data.out.cid,
        },
        size: data.in.size,
        paddedSize: data.out.paddedSize,
        pieceSize: data.out.pieceSize,
      })
    },
  ])
)

test['size: 0'] = async (assert) => {
  const source = await deriveBuffer(64)
  const commP = await CommP.build(source).catch((error) => error.toString())
  assert.ok(commP.includes('not defined for inputs shorter than 65 bytes'))
}
