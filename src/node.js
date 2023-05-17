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
