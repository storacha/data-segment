import * as Node from '../src/node.js'
import * as Piece from '../src/piece.js'
import * as sha512 from 'sync-multihash-sha2/sha512'

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
  return Piece.createLink(node)
}

/**
 * Generates pseudo-random bytes by recursively computing sha512 starting from
 * the empty seed.
 *
 * @param {number} size
 */
export const deriveBuffer = (size = 1024) => {
  const buffer = new Uint8Array(size)
  let offset = 0

  while (offset < size) {
    const { digest } = sha512.digest(
      offset < 64
        ? buffer.subarray(0, offset)
        : buffer.subarray(offset - 64, offset)
    )
    buffer.set(digest.subarray(0, size - offset), offset)
    offset += digest.length
  }

  return buffer
}

/**
 * @param {URL} url
 */
export const load = async (url) => {
  try {
    const cwd = process.env.PWD || process.cwd()
    const path =
      url.protocol === 'file:' && url.pathname.startsWith(cwd)
        ? url.pathname.slice(cwd.length)
        : url

    const response = await fetch(path)
    return await response.blob()
  } catch {
    const importFS = (id = 'node:fs') => import(id)
    const FS = await importFS()
    return new Blob([FS.readFileSync(url)])
  }
}
