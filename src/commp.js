import * as API from './api.js'
import * as Fr32 from './fr32.js'
import * as Link from 'multiformats/link'
import * as Digest from 'multiformats/hashes/digest'
import * as Tree from './tree.js'
import { Size as NodeSize } from './node.js'

/**
 * @see https://github.com/multiformats/go-multihash/blob/dc3bd6897fcd17f6acd8d4d6ffd2cea3d4d3ebeb/multihash.go#L73
 */
const SHA2_256_TRUNC254_PADDED = 0x1012
/**
 * @see https://github.com/ipfs/go-cid/blob/829c826f6be23320846f4b7318aee4d17bf8e094/cid.go#L104
 */
const FilCommitmentUnsealed = 0xf101

/**
 * MaxLayers is the current maximum height of the rust-fil-proofs proving tree.
 */
const MAX_LAYERS = 31 // result of log2( 64 GiB / 32 )

/**
 * Current maximum size of the rust-fil-proofs proving tree.
 */
const MAX_PIECE_SIZE = 1 << (MAX_LAYERS + 5)

/**
 * MaxPiecePayload is the maximum amount of data that one can compute commP for.
 * Constrained by the value of {@link MAX_LAYERS}.
 */
const MAX_PIECE_PAYLOAD = (MAX_PIECE_SIZE / 128) * 127

/**
 * @param {Uint8Array} source
 */
export const build = (source) => {
  if (source.byteLength < Fr32.MIN_PIECE_SIZE) {
    throw new RangeError(
      `commP is not defined for inputs shorter than ${Fr32.MIN_PIECE_SIZE} bytes`
    )
  }

  const tree = Tree.compile(Fr32.pad(source))

  return new CommP({ tree, size: source.byteLength })
}

/**
 * @see https://github.com/filecoin-project/go-fil-commcid/blob/d41df56b4f6a934316028e4d4b93fb220674801d/commcid.go#L141-L144
 * @see https://github.com/filecoin-project/go-fil-commcid/blob/d41df56b4f6a934316028e4d4b93fb220674801d/commcid.go#L79-L81
 *
 * @param {Uint8Array} root
 */
export const toCID = (root) => {
  return Link.create(
    FilCommitmentUnsealed,
    Digest.create(SHA2_256_TRUNC254_PADDED, root)
  )
}

class CommP {
  /**
   * @param {object} data
   * @param {number} data.size
   * @param {API.MerkleTree} data.tree
   */
  constructor({ size, tree }) {
    this.size = size
    this.tree = tree
  }
  get paddedSize() {
    return Fr32.toZeroPaddedSize(this.size)
  }
  get pieceSize() {
    return this.tree.leafCount * NodeSize
  }
  link() {
    return toCID(this.tree.root)
  }
  toJSON() {
    return {
      link: { '/': this.link().toString() },
      size: this.size,
      paddedSize: this.paddedSize,
      pieceSize: this.pieceSize,
    }
  }
}

/**
 * @param {Link.Link} cid
 * @returns {API.MerkleTreeNode}
 */
export const fromLink = (cid) => {
  const { code, multihash } = cid
  if (code !== FilCommitmentUnsealed) {
    throw new RangeError(
      `Invalid CID code ${code}, expected ${FilCommitmentUnsealed}`
    )
  }

  return multihash.digest
}
