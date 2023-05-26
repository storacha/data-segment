import { Fr32 } from '@web3-storage/data-segment'
import { deriveBuffer } from './util.js'

/**
 * @param {Uint8Array} bytes
 */
const zeroPad = (bytes) => {
  const size = Fr32.toZeroPaddedSize(bytes.length)
  const buffer = new Uint8Array(size)
  buffer.set(bytes)
  return buffer
}

const vector = [
  65, 96, 97, 126, 127, 128, 192, 253, 254, 255, 256, 384, 489, 507, 508, 509,
  512, 768, 1015, 1016, 1017, 1024, 1536, 1880, 1890, 2031, 2032, 2033, 3072,
  4063, 4064, 4065, 4096, 6144,
]

/**
 * @type {import("./api.js").TestSuite}
 */
export const test = Object.fromEntries(
  vector.map((size) => [
    `size: ${size}`,
    async (assert) => {
      const source = await deriveBuffer('hello world', size)
      const padded = Fr32.pad(source)
      const unpadded = Fr32.unpad(padded)

      assert.deepEqual(zeroPad(source), unpadded)
      assert.ok(source.length <= unpadded.length)
    },
  ])
)
