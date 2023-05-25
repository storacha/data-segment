import * as API from './api.js'
import { zeroPaddedSizeFromRaw, pieceSizeFromRaw } from './zero-padded.js'
import * as ZeroPad from './zero-padded.js'
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
 * The smallest amount of data for which FR32 padding has a defined result.
 */
const MIN_PIECE_SIZE = 65

/**
 * @param {Uint8Array} source
 */
export const build = async (source) => {
  if (source.byteLength < MIN_PIECE_SIZE) {
    throw new RangeError(
      `commP is not defined for inputs shorter than ${MIN_PIECE_SIZE} bytes`
    )
  }
  const zeroPadded = ZeroPad.pad(source)
  const fr32Padded = Fr32.pad(zeroPadded)
  const tree = await Tree.compile(fr32Padded)

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
    return zeroPaddedSizeFromRaw(this.size)
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
