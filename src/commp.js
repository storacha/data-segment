import { zeroPaddedSizeFromRaw, pieceSizeFromRaw } from './zero-padded.js'
import * as ZeroPad from './zero-padded.js'
import * as Fr32 from './fr32.js'
import { merkleRoot } from './merkle.js'
import * as Link from 'multiformats/link'
import * as Digest from 'multiformats/hashes/digest'

/**
 * @see https://github.com/multiformats/go-multihash/blob/dc3bd6897fcd17f6acd8d4d6ffd2cea3d4d3ebeb/multihash.go#L73
 */
const SHA2_256_TRUNC254_PADDED = 0x1012
/**
 * @see https://github.com/ipfs/go-cid/blob/829c826f6be23320846f4b7318aee4d17bf8e094/cid.go#L104
 */
const FilCommitmentUnsealed = 0xf101

/**
 * @param {Uint8Array} source
 */
export const compile = async (source) => {
  if (source.byteLength <= 64) {
    throw new RangeError(
      'commP is not defined for inputs shorter than 65 bytes'
    )
  }
  const zeroPadded = ZeroPad.pad(source)
  const fr32Padded = Fr32.pad(zeroPadded)
  const root = await merkleRoot(fr32Padded)

  return new CommP({ root, size: source.byteLength })
}

/**
 * @see https://github.com/filecoin-project/go-fil-commcid/blob/d41df56b4f6a934316028e4d4b93fb220674801d/commcid.go#L141-L144
 * @see https://github.com/filecoin-project/go-fil-commcid/blob/d41df56b4f6a934316028e4d4b93fb220674801d/commcid.go#L79-L81
 *
 * @param {Uint8Array} root
 * @param {object} options
 * @param {import('multiformats/codecs/interface').BlockCodec<any, any>} options.codec
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
   * @param {Uint8Array} data.root
   */
  constructor({ size, root }) {
    this.size = size
    this.root = root
  }
  get paddedSize() {
    return zeroPaddedSizeFromRaw(this.size)
  }
  get pieceSize() {
    return pieceSizeFromRaw(this.size)
  }
  link() {
    return toCID(this.root)
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
