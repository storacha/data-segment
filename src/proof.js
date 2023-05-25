import * as API from './api.js'
import { sha256 } from 'multiformats/hashes/sha2'
import { Size as NodeSize } from './node.js'
// MaxLayers is the current maximum height of the rust-fil-proofs proving tree.
const MaxLayers = uint(31) // result of log2( 64 GiB / 32 )

/**
 * @param {API.ProofData} proofData
 * @returns {number}
 */
export const depth = (proofData) => proofData.path.length

/* c8 ignore next 98 */

/**
 * @param {Uint8Array} data
 * @param {API.MerkleTreeNode} root
 * @param {API.ProofData} proofData
 * @returns {Promise<API.Result<void, Error>>}
 */
export async function validateLeaf(data, root, proofData) {
  const leaf = await truncatedHash(data)
  return await validateSubtree(leaf, root, proofData)
}

/**
 * @param {API.MerkleTreeNode} subtree
 * @param {API.MerkleTreeNode} root
 * @param {API.ProofData} proofData
 * @returns {Promise<API.Result<void, Error>>}
 */
export async function validateSubtree(subtree, root, proofData) {
  // Validate the structure first to avoid panics
  const structureValidation = validateProofStructure(proofData)
  if (structureValidation.error) {
    return {
      error: new Error(
        `in ValidateSubtree: ${structureValidation.error.message}`
      ),
    }
  }
  return await validateProof(subtree, root, proofData)
}

const MAX_DEPTH = 63

/**
 * @param {API.MerkleTreeNode} subtree
 * @param {API.ProofData} proofData
 * @returns {Promise<API.Result<API.MerkleTreeNode, Error>>}
 */
export async function computeRoot(subtree, proofData) {
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
  if (proofData.index >> depth(proofData) !== 0) {
    return { error: new Error('index greater than width of the tree') }
  }

  let carry = subtree
  let index = proofData.index
  let right = 0

  for (const p of proofData.path) {
    ;[right, index] = [index & 1, index >> 1]
    carry =
      right === 1 ? await computeNode(p, carry) : await computeNode(carry, p)
  }

  return { ok: carry }
}

/**
 * @param {API.MerkleTreeNode} subtree
 * @param {API.MerkleTreeNode} root
 * @param {API.ProofData} proofData
 * @returns {Promise<API.Result<void, Error>>}
 */
export async function validateProof(subtree, root, proofData) {
  const computedRoot = await computeRoot(subtree, proofData)
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
 * @returns {Promise<API.MerkleTreeNode>}
 */
export async function truncatedHash(payload) {
  const { digest } = await sha256.digest(payload)
  return truncate(digest)
}

/**
 * @param {API.MerkleTreeNode} left
 * @param {API.MerkleTreeNode} right
 * @returns {Promise<API.MerkleTreeNode>}
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
