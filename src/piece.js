import * as API from './api.js'
import * as Fr32 from './fr32.js'
import { Size as NodeSize } from './node.js'
import * as Digest from 'multiformats/hashes/digest'
import * as Link from 'multiformats/link'
import * as Tree from './tree.js'

/**
 * @see https://github.com/multiformats/go-multihash/blob/dc3bd6897fcd17f6acd8d4d6ffd2cea3d4d3ebeb/multihash.go#L73
 */
export const SHA2_256_TRUNC254_PADDED = 0x1012

/**
 * @see https://github.com/ipfs/go-cid/blob/829c826f6be23320846f4b7318aee4d17bf8e094/cid.go#L104
 */
export const FilCommitmentUnsealed = 0xf101

/**
 * MaxLayers is the current maximum height of the rust-fil-proofs proving tree.
 */
export const MAX_LAYERS = 31 // result of log2( 64 GiB / 32 )

/**
 * Current maximum size of the rust-fil-proofs proving tree.
 */
export const MAX_PIECE_SIZE = 1 << (MAX_LAYERS + 5)

/**
 * MaxPiecePayload is the maximum amount of data that one can compute commP for.
 * Constrained by the value of {@link MAX_LAYERS}.
 */
export const MAX_PIECE_PAYLOAD = (MAX_PIECE_SIZE / 128) * 127

// @see https://github.com/filecoin-project/go-state-types/blob/master/abi/piece.go#L12

/**
 * @typedef {{ size: API.PaddedPieceSize, pieceCID: string }} PieceInfo
 */

/**
 * @param {number} size
 * @returns {API.PaddedPieceSize}
 */
export const toPaddedSize = (size) => size + Math.floor(size / 127)

/**
 * @param {number} size
 * @returns {API.PaddedPieceSize}
 */
export const PaddedPieceSize = (size) => {
  const result = validatePaddedPieceSize(size)
  if (result.error) {
    throw result.error
  } else {
    return result.ok
  }
}

/**
 *
 * @param {number} size
 */
export const UnpaddedPieceSize = (size) => {
  const result = validateUnpaddedPieceSize(size)
  if (result.error) {
    throw result.error
  } else {
    return result.ok
  }
}

/**
 * @param {number} size
 * @returns {API.Result<API.UnpaddedPieceSize, Error>}
 */
export const validateUnpaddedPieceSize = (size) => {
  if (size < 127) {
    return { error: new Error('minimum piece size is 127 bytes') }
  }

  if (size >> countTrailingZeros(size) !== 127) {
    return {
      error: new Error(
        'Unpadded piece size must be a power of 2 multiple of 127'
      ),
    }
  }

  return { ok: size }
}

/**
 *
 * @param {number} value
 */
const countTrailingZeros = (value) => {
  if (value === 0) {
    return 32
  }

  let count = 0
  while ((value & 1) === 0) {
    value >>= 1
    count++
  }

  return count
}

/**
 * @param {API.PaddedPieceSize} s
 * @returns {API.UnpaddedPieceSize}
 */
export const unpadded = (s) => s - Math.floor(s / 128)

/**
 * @param {number} size
 * @returns {API.Result<API.PaddedPieceSize, RangeError>}
 */
export const validatePaddedPieceSize = (size) => {
  if (size < 128) {
    return { error: RangeError('minimum padded piece size is 128 bytes') }
  }

  if (Math.log2(size) % 1 !== 0) {
    return { error: Error('padded piece size must be a power of 2') }
  }

  return { ok: size }
}

class Piece {
  /**
   * @param {object} data
   * @param {number} data.size
   * @param {API.MerkleTree} data.tree
   */
  constructor({ size, tree }) {
    this.contentSize = size
    this.tree = tree
  }
  get root() {
    return this.tree.root
  }
  get paddedSize() {
    return Fr32.toZeroPaddedSize(this.contentSize)
  }
  get size() {
    return this.tree.leafCount * NodeSize
  }
  link() {
    return createLink(this.tree.root)
  }
  toJSON() {
    return {
      link: { '/': this.link().toString() },
      contentSize: this.contentSize,
      paddedSize: this.paddedSize,
      size: this.size,
    }
  }
}

/**
 * Creates Piece CID from the the merkle tree root. It will not perform
 * any validation.
 *
 * @param {API.MerkleTreeNode} root
 * @returns {API.PieceLink}
 */
export const createLink = (root) =>
  Link.create(
    FilCommitmentUnsealed,
    Digest.create(SHA2_256_TRUNC254_PADDED, root)
  )

/**
 * @param {Uint8Array} source
 * @returns {API.Piece}
 */
export const build = (source) => {
  if (source.byteLength < Fr32.MIN_PIECE_SIZE) {
    throw new RangeError(
      `commP is not defined for inputs shorter than ${Fr32.MIN_PIECE_SIZE} bytes`
    )
  }

  const tree = Tree.compile(Fr32.pad(source))

  return new Piece({ tree, size: source.byteLength })
}
