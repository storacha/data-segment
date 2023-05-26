import { CommP } from '@web3-storage/data-segment'
import { deriveBuffer } from './util.js'
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
      const source = await deriveBuffer('hello world', data.in.size)
      const commP = await CommP.build(source)
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
  const source = await deriveBuffer('hello world', 64)
  const commP = await CommP.build(source).catch((error) => error.toString())
  assert.ok(commP.includes('not defined for inputs shorter than 65 bytes'))
}
