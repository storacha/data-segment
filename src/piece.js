import * as API from './api.js'
import * as Fr32 from './fr32.js'
import { Size as NodeSize } from './node.js'
import * as Digest from 'multiformats/hashes/digest'
import * as Link from 'multiformats/link'
import * as Tree from './piece/tree.js'
import * as UnpaddedSize from './piece/unpadded-size.js'
import * as PaddedSize from './piece/padded-size.js'

export { Tree }

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

export { UnpaddedSize, PaddedSize }

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
    return BigInt(this.tree.leafCount) * BigInt(NodeSize)
  }
  link() {
    return createLink(this.tree.root)
  }
  toJSON() {
    return {
      link: { '/': this.link().toString() },
      contentSize: this.contentSize,
      paddedSize: this.paddedSize,
      size: Number(this.size),
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
 * @returns {API.ContentPiece}
 */
export const build = (source) => {
  if (source.byteLength < Fr32.MIN_PIECE_SIZE) {
    throw new RangeError(
      `commP is not defined for inputs shorter than ${Fr32.MIN_PIECE_SIZE} bytes`
    )
  }

  const tree = Tree.build(Fr32.pad(source))

  return new Piece({ tree, size: source.byteLength })
}
