import zeroComm from './zero-comm/gen.js'
import * as API from './api.js'
import * as Node from './node.js'

const MAX_LEVEL = Math.floor(zeroComm.length / Node.Size)

/**
 * simple access by level, only levels between `0` and `64` inclusive are
 * available otherwise throws an error.
 *
 * @param {number} level
 * @returns {API.MerkleTreeNode}
 */
export const fromLevel = (level) => {
  if (level < 0 || level > MAX_LEVEL) {
    throw new Error(
      `Only levels between 0 and ${MAX_LEVEL} inclusive are available`
    )
  }

  return zeroComm.subarray(Node.Size * level, Node.Size * (level + 1))
}

/**
 * @param {number} size
 */
export const fromSize = (size) => {
  const level = log2Ceil(size / Node.Size)
  if (level > MAX_LEVEL) {
    throw new Error(`zero commitments for size ${size} are not supported`)
  }

  return zeroComm.subarray(Node.Size * level, Node.Size * (level + 1))
}

/**
 * Log2Ceil computes the integer logarithm with ceiling for 64 bit unsigned ints
 *
 * @param {number} value
 */
export const log2Ceil = (value) => (value <= 1 ? 0 : log2Floor(value - 1) + 1)

/**
 * @param {number} value
 */
const log2Floor = (value) => {
  if (value === 0) {
    return 0
  }
  // Count the number of leading zeros in the 32-bit representation.
  const zeros =
    Math.clz32(value / 0x100000000) + Math.clz32(value % 0x100000000)

  return 64 - zeros - 1
}
