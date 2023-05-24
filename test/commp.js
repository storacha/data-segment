import { deriveBuffer } from './util.js'
import * as CommP from '../src/commp.js'
import { vector } from './commp.vector.js'

/**
 * @type {import("./api.js").TestSuite}
 */
export const test = Object.fromEntries(
  Object.values(vector).map((data) => [
    `size: ${data.size} seed: ${data.seed}`,
    async (assert) => {
      const source = await deriveBuffer(data.seed, data.size)
      const commP = await CommP.build(source)
      assert.deepEqual(commP.toJSON(), {
        link: {
          '/': data.cid,
        },
        size: data.size,
        paddedSize: data.paddedSize,
        pieceSize: data.pieceSize,
      })
    },
  ])
)
