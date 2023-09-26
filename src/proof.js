import * as API from './api.js'

import { Size as NodeSize } from './node.js'
import { CBOR, SHA256 } from './ipld.js'

/**
 * @param {API.ProofData} proof
 * @returns {API.MerkleTreePath}
 */
export const path = ([, path]) => path

/**
 * @param {API.ProofData} proof
 * @returns {API.uint64}
 */
export const at = ([at]) => at

/**
 * @param {API.ProofData} proof
 * @returns {number}
 */
export const depth = (proof) => path(proof).length

/* c8 ignore next 98 */

/**
 * @param {Uint8Array} data
 * @param {API.MerkleTreeNode} root
 * @param {API.ProofData} proof
 * @returns {API.Result<void, Error>}
 */
export function validateLeaf(data, root, proof) {
  const leaf = truncatedHash(data)
  return validateSubtree(leaf, root, proof)
}

/**
 * @param {API.MerkleTreeNode} subtree
 * @param {API.MerkleTreeNode} root
 * @param {API.ProofData} proof
 * @returns {API.Result<void, Error>}
 */
export function validateSubtree(subtree, root, proof) {
  // Validate the structure first to avoid panics
  const structureValidation = validateProofStructure(proof)
  if (structureValidation.error) {
    return {
      error: new Error(
        `in ValidateSubtree: ${structureValidation.error.message}`
      ),
    }
  }
  return validateProof(subtree, root, proof)
}

const MAX_DEPTH = 63

/**
 * @param {API.MerkleTreeNode} subtree
 * @param {API.ProofData} proofData
 * @returns {API.Result<API.MerkleTreeNode, Error>}
 */
export function computeRoot(subtree, proofData) {
  if (subtree === null) {
    return { error: new Error('nil subtree cannot be used') }
  }
  if (depth(proofData) > MAX_DEPTH) {
    return {
      error: new Error(
        'merkleproofs with depths greater than 63 are not supported'
      ),
    }
  }

  let index = at(proofData)
  if (index >> BigInt(depth(proofData)) !== 0n) {
    return { error: new Error('index greater than width of the tree') }
  }

  let carry = subtree
  let right = 0n

  for (const p of path(proofData)) {
    ;[right, index] = [index & 1n, index >> 1n]
    carry = right === 1n ? computeNode(p, carry) : computeNode(carry, p)
  }

  return { ok: carry }
}

/**
 * @param {API.MerkleTreeNode} subtree
 * @param {API.MerkleTreeNode} root
 * @param {API.ProofData} proofData
 * @returns {API.Result<void, Error>}
 */
export function validateProof(subtree, root, proofData) {
  const computedRoot = computeRoot(subtree, proofData)
  if (computedRoot.error) {
    return { error: new Error(`computing root: ${computedRoot.error.message}`) }
  }

  if (!areNodesEqual(computedRoot.ok, root)) {
    return {
      error: new Error('inclusion proof does not lead to the same root'),
    }
  }
  return { ok: undefined }
}

/**
 * @param {API.ProofData} proofData
 * @returns {API.Result<void, Error>}
 */
export function validateProofStructure(proofData) {
  /**
   * In the Go implementation, this function does not perform any checks and
   * always returns nil error
   * @see https://github.com/filecoin-project/go-data-segment/blob/14e4afdb87895d8562142f4f6cf03662ec407237/merkletree/proof.go#L90-L92
   */
  return { ok: undefined }
}

/**
 * @param {Uint8Array} payload
 * @returns {API.MerkleTreeNode}
 */
export function truncatedHash(payload) {
  const { digest } = SHA256.digest(payload)
  return truncate(digest)
}

/**
 * @param {API.MerkleTreeNode} left
 * @param {API.MerkleTreeNode} right
 * @returns {API.MerkleTreeNode}
 */
export const computeNode = (left, right) => {
  const payload = new Uint8Array(left.length + right.length)
  payload.set(left, 0)
  payload.set(right, left.length)
  return truncatedHash(payload)
}

/**
 * @param {API.MerkleTreeNode} node
 * @returns {API.MerkleTreeNode}
 */
export function truncate(node) {
  node[NodeSize - 1] &= 0b00111111
  return node
}

/* c8 ignore next 17 */
/**
 *
 * @param {API.MerkleTreeNode} node1
 * @param {API.MerkleTreeNode} node2
 * @returns {boolean}
 */
function areNodesEqual(node1, node2) {
  if (node1.length !== node2.length) {
    return false
  }
  for (let i = 0; i < node1.length; i++) {
    if (node1[i] !== node2[i]) {
      return false
    }
  }
  return true
}

/**
 * Takes data model and returns an IPLD View of it.
 *
 * @param {object} source
 * @param {API.uint64} source.at
 * @param {API.MerkleTreePath} source.path
 * @returns {API.ProofData}
 */
export const create = ({ at, path }) => [at, path]

/**
 * Takes proof in somewhat arbitrary form and returns a proof data.
 * @param {[API.uint64|number, API.MerkleTreePath]|{at:API.uint64|number, path: API.MerkleTreePath}} source
 * @returns {API.ProofData}
 */
export const from = (source) => {
  const [at, path] = Array.isArray(source) ? source : [source.at, source.path]

  return create({ at: BigInt(at), path })
}
