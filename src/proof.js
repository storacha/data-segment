import * as API from './merkletree.api.js'
import { sha256 } from 'multiformats/hashes/sha2'

/**
 * @typedef {API.ProofData} ProofData
 */

/**
 * @param {API.ProofData} proofData
 * @returns {number}
 */
export function depth(proofData) {
  return proofData.path.length
}

/**
 * @param {Uint8Array} data
 * @param {API.Node} root
 * @param {API.ProofData} proofData
 * @returns {Promise<API.Result<void, Error>>}
 */
export async function validateLeaf(data, root, proofData) {
  const leaf = await truncatedHash(data)
  return await validateSubtree(leaf, root, proofData)
}

/**
 * @param {API.Node} subtree
 * @param {API.Node} root
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

/**
 * @param {API.Node} subtree
 * @param {API.ProofData} proofData
 * @returns {Promise<API.Result<API.Node, Error>>}
 */
export async function computeRoot(subtree, proofData) {
  if (subtree === null) {
    return { error: new Error('nil subtree cannot be used') }
  }
  if (depth(proofData) > 63) {
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
 * @param {API.Node} subtree
 * @param {API.Node} root
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
  // In the Go implementation, this function does not perform any checks and always returns nil error
  return { ok: undefined }
}

/**
 * @param {Uint8Array} payload
 * @returns {Promise<API.Node>}
 */
export async function truncatedHash(payload) {
  const { digest } = await sha256.digest(payload)
  digest[32 - 1] &= 0b00111111
  return digest
}

/**
 * @param {API.Node} left
 * @param {API.Node} right
 * @returns {Promise<API.Node>}
 */
export const computeNode = (left, right) => {
  const payload = new Uint8Array(left.length + right.length)
  payload.set(left, 0)
  payload.set(right, left.length)
  return truncatedHash(payload)
}

/**
 *
 * @param {API.Node} node
 * @returns {API.Node}
 */
export function truncate(node) {
  node[32 - 1] &= 0b00111111
  return node
}

/**
 *
 * @param {API.Node} node1
 * @param {API.Node} node2
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
