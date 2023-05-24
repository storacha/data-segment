import * as sha2 from 'multiformats/hashes/sha2'

/**
 * simple sha256 utility function that takes two `Buffer`s and gets the hash of
 * them when combined
 *
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {Promise<Uint8Array>}
 */
const sha256 = async (a, b) => {
  const buffer = new Uint8Array(a.length + b.length)
  buffer.set(a, 0)
  buffer.set(b, a.length)
  const { digest } = await sha2.sha256.digest(buffer)
  digest[31] &= 0b00111111 // fr32 compatible, zero out last two bytes
  return digest
}

/**
 * merkle tree above layer-0, expects a stream of hashes and will return a
 * stream of hashes
 *
 * @param {Iterable<Uint8Array>|AsyncIterable<Uint8Array>} hashstream
 * @param {number} level
 */
export async function* merkle(hashstream, level) {
  let last = null
  let count = 0
  for await (const h of hashstream) {
    count++
    if (h.length !== 32) {
      throw new Error('Hash chunklength is not 32-bytes: ' + h)
    }
    if (last) {
      const hl = await sha256(last, h)
      yield hl
      last = null
    } else {
      last = h
    }
  }
  if (count === 1) {
    // root!
    yield /** @type {Uint8Array} */ (last)
  } else if (last != null) {
    throw new Error('uneven number of hashes!')
  }
}

const empty = new Uint8Array(0)

/**
 * this is the bottom layer, taking a raw byte stream and returning hashes
 * @param {Iterable<Uint8Array>} source
 */

export function* hash(source) {
  const payload = source
  let leftover = empty
  for (const chunk of payload) {
    const chunkLength = chunk.length
    for (let offset = 0; offset < chunk.length; offset += 32) {
      const availableLength = chunkLength - offset
      if (leftover.length + availableLength < 32) {
        const buffer = new Uint8Array(leftover.length + availableLength)
        buffer.set(leftover, 0)
        buffer.set(chunk.subarray(offset), leftover.length)
        leftover = buffer
        break
      }

      if (leftover.length === 0) {
        yield chunk.subarray(offset, offset + 32)
      } else {
        const buffer = new Uint8Array(32)
        buffer.set(leftover, 0)
        buffer.set(
          chunk.subarray(offset, offset - leftover.length + 32),
          leftover.length
        )
        yield buffer
        offset -= leftover.length
        leftover = empty
      }
    }
  }
  if (leftover.length > 0) {
    throw new Error(`Unexpected leftover chunk of ${leftover.length} bytes`)
  }
}

/**
 *
 * @param {Uint8Array} h1
 * @param {Uint8Array} h2
 * @param {AsyncIterable<Uint8Array>} iter
 */
async function* primedIterIter(h1, h2, iter) {
  yield h1
  yield h2
  yield* iter
}

/**
 * @description Given a stream or async iterator (of `Buffer`s), return a merkle
 * root as a `Buffer` using a 32-byte chunked sha256 binary tree.
 *
 * @param {Uint8Array} source - a stream or async iterator of
 * raw bytes. The byte length is expected to be divisible by 64 (pairs of
 * 32-bytes).
 * @returns {Promise<Uint8Array>}
 */
export async function merkleRoot(source) {
  const fr32HashStream = hash([source])
  /** @type {AsyncIterable<Uint8Array>|Iterable<Uint8Array>} */
  let lastIter = fr32HashStream
  let level = 0
  /* @type {Uint8Array|null} */
  let result = null
  while (result == null) {
    // directly access the async iterator because we want to check how many
    // results it gives, if it gives one then we have our root, more than one
    // means we need to create another level on top of this one
    const merkleIter = merkle(lastIter, level++)[Symbol.asyncIterator]()
    const h1 = await merkleIter.next()
    if (h1.done) {
      // we should always get at least one result
      throw new Error("Shouldn't be done already")
    }

    const h2 = await merkleIter.next()
    // only one result means we have our final root, otherwise we're at an
    // intermediate level and need to make at least one more level
    if (!h2.done) {
      lastIter = primedIterIter(h1.value, h2.value, merkleIter)
    } else {
      result = h1.value
      return h1.value
    }
  }

  return result
}
