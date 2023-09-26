import * as API from './api.js'
import { maxIndexEntriesInDeal, EntrySize } from './index.js'
import * as Proof from './proof.js'
import { SHA256, CBOR } from './ipld.js'
import * as IPLD from './ipld.js'

export { Proof }

/**
 * @param {API.PaddedPieceSize} size
 * @returns {API.uint64}
 */
export const indexAreaStart = (size) =>
  size - BigInt(maxIndexEntriesInDeal(size)) * EntrySize

/**
 * Encodes data layout into a CBOR block.
 *
 * @param {API.InclusionProof} proof
 * @returns {API.ByteView<API.InclusionProof, typeof CBOR.code>}
 */
export const encode = (proof) => CBOR.encode(proof)

/**
 * @param {API.InclusionProof} proof
 */
export const link = (proof) =>
  IPLD.createLink(encode(proof), { codec: CBOR, hasher: SHA256 })

/**
 * Decodes CBOR encoded data layout. It is reverse of {@link encode}.
 *
 * @param {API.ByteView<API.InclusionProof, typeof CBOR.code>} bytes
 */
export const decode = (bytes) => {
  const [tree, index] = CBOR.decode(bytes)

  // Note we need to go through this to ensure the bigint conversion
  return create({ tree: Proof.from(tree), index: Proof.from(index) })
}

/**
 * Takes data model and returns an IPLD View of it.
 *
 * @param {object} source
 * @param {API.ProofData} source.tree
 * @param {API.ProofData} source.index
 * @returns {API.InclusionProof}
 */
export const create = ({ tree, index }) => [tree, index]

/**
 * Accessor for the segment (sub) tree.
 *
 * @param {API.InclusionProof} proof
 * @returns {API.ProofData}
 */
export const tree = ([tree]) => tree

/**
 * Accessor for the segment index.
 *
 * @param {API.InclusionProof} proof
 * @returns {API.ProofData}
 */
export const index = ([_, index]) => index
