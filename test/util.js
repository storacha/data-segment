import * as Node from '../src/node.js'
import * as CommP from '../src/commp.js'
import { sha512 } from 'multiformats/hashes/sha2'

const sampleSizes1 = /** @type {const} */ ([
  256 << 20,
  1024 << 20,
  512 << 20,
  512 << 20,
  1024 << 20,
  256 << 20,
  512 << 20,
  1024 << 20,
  256 << 20,
  512 << 20,
])

/**
 *
 * @param {number} x
 */
export const commForDeal = (x) => {
  const bytes = [0xd, 0xe, 0xa, 0x1]

  let s = x.toString()
  for (let i = 5; s.length !== 0; i++) {
    bytes[i] = s.charCodeAt(0) - '0'.charCodeAt(0)
    s = s.slice(1)
  }

  return Node.from(bytes)
}

/**
 * @param {number} x
 */
const cidForDeal = (x) => {
  const node = commForDeal(x)
  return CommP.toCID(node)
}

/**
 * Generates pseudo-random bytes by recursively computing sha512 starting from
 * the empty seed.
 *
 * @param {number} size
 */
export const deriveBuffer = async (size = 1024) => {
  const buffer = new Uint8Array(size)
  let offset = 0

  while (offset < size) {
    const { digest } = await sha512.digest(
      offset < 64
        ? buffer.subarray(0, offset)
        : buffer.subarray(offset - 64, offset)
    )
    buffer.set(digest.subarray(0, size - offset), offset)
    offset += digest.length
  }

  return buffer
}
