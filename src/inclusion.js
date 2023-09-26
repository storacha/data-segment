import * as API from './api.js'
import { maxIndexEntriesInDeal, EntrySize } from './index.js'
import * as Proof from './proof.js'
import { SHA256, CBOR, View } from './ipld.js'

/**
 * @param {API.PaddedPieceSize} size
 * @returns {API.uint64}
 */
export const indexAreaStart = (size) =>
  size - BigInt(maxIndexEntriesInDeal(size)) * EntrySize

/**
 * Maps data model into a layout expected in the encoding. This is to
 * match layout used by the go implementation.
 *
 * @param {API.InclusionProof} proof
 * @returns {API.InclusionProofLayout}
 */
export const into = ({ tree, index }) => [Proof.into(tree), Proof.into(index)]

/**
 * Maps data layout to a data model. This is reverse of {@link into} and used
 * post decode to shape data into a model expected by the rest of the code
 * base.
 *
 * @param {API.InclusionProofLayout} layout
 * @returns {API.InclusionProof}
 */
export const from = ([tree, index]) => ({
  tree: Proof.from(tree),
  index: Proof.from(index),
})

/**
 * Encodes data layout into a CBOR block.
 *
 * @param {API.InclusionProofLayout} proof
 * @returns {API.ByteView<API.InclusionProofLayout, typeof CBOR.code>}
 */
export const encode = (proof) => CBOR.encode(proof)

/**
 * Decodes CBOR encoded data layout. It is reverse of {@link encode}.
 *
 * @param {API.ByteView<API.InclusionProofLayout, typeof CBOR.code>} bytes
 */
export const decode = (bytes) => {
  const [tree, index] = CBOR.decode(bytes)
  // Note we need to go through this to ensure the bigint conversion
  return into({ tree: Proof.from(tree), index: Proof.from(index) })
}

/**
 * Extension to an IPLD View class to provide accessors for the data model
 * fields.
 *
 * @extends {View<API.InclusionProof, API.InclusionProofLayout, typeof CBOR.code, typeof SHA256.code>}
 * @implements {API.InclusionProofView}
 */
class InclusionProofView extends View {
  get tree() {
    return this.model.tree
  }
  get index() {
    return this.model.index
  }
}

// Settings used by the IPLD View.
const hasher = SHA256
const codec = { ...CBOR, encode, decode }
const layout = { into, from }

/**
 * Takes data model and returns an IPLD View of it.
 *
 * @param {API.InclusionProof} model
 * @returns {API.InclusionProofView}
 */
export const create = (model) =>
  new InclusionProofView({ model, hasher, codec, layout })

/**
 * Takes byte encoded proof and returns an IPLD View of it.
 *
 * @param {API.InclusionProofView['bytes']} bytes
 * @returns {API.InclusionProofView}
 */
export const view = (bytes) =>
  new InclusionProofView({ bytes, hasher, codec, layout })
