import * as API from './api.js'
import * as Node from './node.js'
import * as Proof from './proof.js'
export { computeNode } from './proof.js'

const nodeSize = Node.Size
const bytesInInt = 64 / 8

/**
 * `newBareTree` allocates that memory needed to construct a tree with a
 * specific amount of leafs.
 *
 * The construction rounds the amount of leafs up to the nearest two-power with
 * zeroed nodes to ensure that the tree is perfect and hence all internal node's
 * have well-defined children.
 *
 * @param {number} leafs
 */
export function newBareTree(leafs) {
  const adjustedLeafs = 1 << Math.ceil(Math.log2(leafs))
  /** @type {API.TreeData} */
  const tree = {
    nodes: new Array(Math.ceil(Math.log2(adjustedLeafs)) + 1),
    leafs: leafs,
  }

  for (const level of tree.nodes.keys()) {
    tree.nodes[level] = new Array(1 << level)
  }

  return tree
}

/**
 * @param {API.TreeData} tree
 */
export const depth = (tree) => {
  return tree.nodes.length
}

/**
 *
 * @param {API.TreeData} tree
 * @returns {API.MerkleTreeNode}
 */
export const root = (tree) => {
  return tree.nodes[0][0]
}

/**
 * @param {Uint8Array} source
 * @returns {Uint8Array[]}
 */
export const split = (source) => {
  const count = source.length / 32
  const chunks = new Array(count)
  for (let n = 0; n < count; n++) {
    const offset = n * 32
    const chunk = source.subarray(offset, offset + 32)
    chunks[n] = chunk
  }
  return chunks
}

/**
 * @param {Uint8Array} source
 */
export const compile = (source) => buildFromChunks(split(source))

/**
 * @param {Uint8Array[]} chunks
 */
export const buildFromChunks = async (chunks) => {
  if (chunks.length === 0) {
    throw new RangeError('Empty source')
  }

  const leafs = chunks //await Promise.all(chunks.map(truncatedHash))
  return await buildFromLeafs(leafs)
}

/**
 * @param {API.MerkleTreeNode[]} leafs
 * @returns {Promise<API.MerkleTree>}
 */
export const buildFromLeafs = async (leafs) => {
  const tree = newBareTree(leafs.length)
  // Set the padded leaf nodes
  tree.nodes[depth(tree) - 1] = padLeafs(leafs)
  let parentNodes = tree.nodes[depth(tree) - 1]
  // Construct the Merkle tree bottom-up, starting from the leafs
  // Note the -1 due to 0-indexing the root level
  for (let level = depth(tree) - 2; level >= 0; level--) {
    /** @type {API.MerkleTreeNode[]} */
    const currentLevel = new Array(Math.ceil(parentNodes.length / 2))
    // Traverse the level left to right
    for (let i = 0; i + 1 < parentNodes.length; i = i + 2) {
      currentLevel[Math.floor(i / 2)] = await Proof.computeNode(
        parentNodes[i],
        parentNodes[i + 1]
      )
    }
    tree.nodes[level] = currentLevel
    parentNodes = currentLevel
  }

  return new MerkleTree(tree)
}

/**
 * @param {API.MerkleTreeNode[]} leafs
 * @returns {API.MerkleTreeNode[]}
 */
export const padLeafs = (leafs) => {
  const paddingAmount = (1 << Math.ceil(Math.log2(leafs.length))) - leafs.length
  // arrays are zeroed by default in JS
  const paddingLeafs = new Array(paddingAmount)

  return [...leafs, ...paddingLeafs]
}

class MerkleTree {
  /**
   * @param {API.TreeData} model
   */
  constructor(model) {
    this.model = model
  }

  get root() {
    return root(this.model)
  }
  get depth() {
    return depth(this.model)
  }
  get leafs() {
    const { nodes } = this.model
    return nodes[nodes.length - 1]
  }
  get leafCount() {
    return this.model.leafs
  }
  /**
   *
   * @param {number} level
   * @param {number} index
   */
  node(level, index) {
    const { nodes } = this.model
    return nodes[level][index]
  }
}
