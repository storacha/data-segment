import * as API from './api.js'

export const Size = 32

/**
 * @param {number[]} bytes
 */
export const of = (...bytes) => from(bytes)

/**
 * @param {Iterable<number>} bytes
 * @returns {API.MerkleTreeNode}
 */
export const from = (bytes) => {
  /* c8 ignore next 7 */
  if (bytes instanceof Uint8Array) {
    if (bytes.length > Size) {
      return bytes.subarray(0, Size)
    } else if (bytes.length == Size) {
      return bytes
    }
  }

  const node = new Uint8Array(Size)
  node.set([...bytes])
  return node
}

export const empty = () => EMPTY

/**
 *
 * @param {API.MerkleTreeNode} node
 * @returns
 */
export const isEmpty = (node) => {
  if (node === EMPTY) {
    return true
  } else if (node.length === Size) {
    for (const byte of node) {
      if (byte !== 0) {
        return false
      }
    }
    return true
  }
  return false
}

const EMPTY = from(new Uint8Array(Size).fill(0))
Object.freeze(EMPTY.buffer)
