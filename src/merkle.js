import * as sha2 from 'multiformats/hashes/sha2'
import { computeNode, split } from './tree.js'

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
      const hl = await computeNode(last, h)
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

/**
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
  // const fr32HashStream = hash([source])
  /** @type {AsyncIterable<Uint8Array>|Iterable<Uint8Array>} */
  let lastIter = split(source)
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
