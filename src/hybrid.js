import * as API from './api.js'
import * as Node from './node.js'
import * as ZeroComm from './zero-comm.js'
import * as Proof from './proof.js'
import { pow2 } from './uint64.js'

/**
 * We allow up to 2 ** 60 leafs in the tree, with is greater than then
 * Number.MAX_SAFE_INTEGER ((2 ** 53) - 1) which is why we need to use
 * uint64s.
 */
export const MAX_LOG2_LEAFS = 60

/**
 * @param {number} log2Leafs
 * @returns {API.AggregateTree}
 */
export const create = (log2Leafs) => {
  if (log2Leafs > MAX_LOG2_LEAFS) {
    throw new RangeError(`too many leafs: 2 ** ${log2Leafs}`)
  }

  if (log2Leafs < 0) {
    throw new RangeError(`cannot have negative log2Leafs`)
  }

  return new Hybrid(log2Leafs)
}

class Hybrid {
  /**
   * The sparse array contains the data of the tree. Levels of the tree are
   * counted from the leaf layer (layer 0).
   * Where the leaf layer lands depends on the `log2Leafs` value.
   * The root node of a the tree is stored at position [1].
   *
   * @param {number} log2Leafs
   * @param {SparseArray<API.MerkleTreeNode>} data
   */

  constructor(log2Leafs, data = new SparseArray()) {
    this.log2Leafs = log2Leafs
    this.data = data
  }

  get maxLevel() {
    return this.log2Leafs
  }

  get leafCount() {
    return 2n ** BigInt(this.log2Leafs)
  }

  get depth() {
    return this.log2Leafs + 1
  }

  get root() {
    return this.node(this.maxLevel, 0n)
  }

  /**
   * Collects a proof from the specified node to the root of the tree.
   *
   * @param {number} level
   * @param {API.uint64} index
   * @returns {API.ProofData}
   */
  collectProof(level, index) {
    validateLevelIndex(this.log2Leafs, level, index)
    const path = []
    let currentLevel = level
    let currentIndex = index
    while (currentLevel < this.maxLevel) {
      // idx^1 is the sibling index
      const node = this.node(currentLevel, currentIndex ^ 1n)
      currentIndex = currentIndex / 2n
      path.push(node)
      currentLevel++
    }

    return { path, index }
  }

  /**
   *
   * @param {number} level
   * @param {API.uint64} index
   */
  node(level, index) {
    const node = getNodeRaw(this, level, index)
    return node || ZeroComm.fromLevel(level)
  }

  /**
   *
   * @param {number} level
   * @param {API.uint64} index
   * @param {API.MerkleTreeNode} node
   */
  setNode(level, index, node) {
    validateLevelIndex(this.log2Leafs, level, index)

    if (level > 0) {
      let left = getNodeRaw(this, level - 1, 2n * index)
      let right = getNodeRaw(this, level - 1, 2n * index + 1n)

      if (left) {
        throw new RangeError('left subtree is not empty')
      }

      if (right) {
        throw new RangeError('right subtree is not empty')
      }
    }

    this.data.set(idxFor(this.log2Leafs, level, index), node)

    let currentIndex = index
    let n = level
    while (n < this.maxLevel) {
      const nextIndex = currentIndex >> 1n
      // clear the lowest bit of index for left node
      const left = getNodeRaw(this, n, currentIndex & ~1n)
      // set the lowest bit of index for right now
      const right = getNodeRaw(this, n, currentIndex | 1n)

      const node =
        /* c8 ignore next 2 */ // TODO: make test to cover this code path
        left == null && right == null
          ? Node.empty()
          : Proof.computeNode(
              left || ZeroComm.fromLevel(n),
              right || ZeroComm.fromLevel(n)
            )

      this.data.set(idxFor(this.log2Leafs, n + 1, nextIndex), node)
      currentIndex = nextIndex
      n++
    }
    return this
  }

  clear() {
    clear(this)
    return this
  }
}

/**
 * @type {number}
 */
const SparseBlockLog2Size = 8

/**
 * @type {number}
 */
const SparseBlockSize = 1 << SparseBlockLog2Size

const BigIntSparseBlockSize = BigInt(SparseBlockSize)

/**
 * @template T
 */
class SparseArray {
  /**
   * @param {Map<API.uint64, T[]>} subs
   */
  constructor(subs = new Map()) {
    /**
     * @private
     */
    this.subs = subs
  }
  clear() {
    this.subs.clear()
  }
  /**
   * @param {API.uint64} index
   * @returns {T | undefined}
   */
  at(index) {
    const subIndex = index / BigIntSparseBlockSize
    const sub = this.subs.get(subIndex)
    if (!sub) {
      return undefined
    }

    return sub[Number(index % BigIntSparseBlockSize)]
  }
  /**
   * @param {API.uint64} index
   * @param {T} value
   */
  set(index, value) {
    const subIndex = index / BigIntSparseBlockSize
    let sub = this.subs.get(subIndex)
    if (!sub) {
      sub = new Array(SparseBlockSize)
      this.subs.set(subIndex, sub)
    }

    sub[Number(index % BigIntSparseBlockSize)] = value
  }

  // ignore fon now it will be used by inclusion code
  /* c8 ignore next 25 */
  /**
   * @param {API.uint64} start
   * @param {API.uint64} end
   * @private
   */
  slice(start, end) {
    const startSub = start / BigIntSparseBlockSize
    const endSub = (end - 1n) / BigIntSparseBlockSize
    if (startSub !== endSub) {
      throw new Error('requested slice does not align with one sparse block')
    }

    let sub = this.subs.get(startSub)
    if (!sub) {
      sub = new Array(SparseBlockSize)
      this.subs.set(startSub, sub)
    }

    return sub.slice(
      Number(start % BigIntSparseBlockSize),
      Number(end % BigIntSparseBlockSize)
    )
  }
}

/**
 * @param {API.MerkleTreeBuilder} tree
 * @param {API.MerkleTreeNodeSource[]} values
 */
export const batchSet = (tree, values) => {
  for (const {
    location: { level, index },
    node,
  } of values) {
    tree.setNode(level, index, node)
  }
}

/**
 * @param {Hybrid} tree
 */
export const clear = (tree) => {
  tree.data.clear()
}

/**
 * @typedef {{
 * log2Leafs: number
 * data: SparseArray<API.MerkleTreeNode>
 * }} Model
 *
 * @param {Model} tree
 * @param {number} level
 * @param {API.uint64} idx
 */
const getNodeRaw = (tree, level, idx) => {
  validateLevelIndex(tree.log2Leafs, level, idx)

  return tree.data.at(idxFor(tree.log2Leafs, level, idx))
}

/**
 * @param {number} maxLevel
 * @param {number} level
 * @param {API.uint64} index
 */
const validateLevelIndex = (maxLevel, level, index) => {
  if (level < 0) {
    throw new RangeError('level can not be negative')
  }

  if (level > maxLevel) {
    throw new RangeError(`level too high: ${level} >= ${maxLevel}`)
  }

  if (index > (1 << (maxLevel - level)) - 1) {
    throw new RangeError(
      `index too large for level: idx ${index}, level ${level} : ${
        (1 << (maxLevel - level)) - 1
      }`
    )
  }
}

/**
 * @param {number} maxLevel
 * @param {number} level
 * @param {API.uint64} index
 * @returns {API.uint64}
 */
export const idxFor = (maxLevel, level, index) => {
  const depth = maxLevel - level
  // Hybrid Tree stores the MT as smaller trees in chunks dictated by SparseBlockSize
  // For example with SparseBlockLog2Size of 8, each SparseBlock will store a single
  // 8 deep tree. These threes are then stored one after breath-wise.
  const SubtreeDepth = SparseBlockLog2Size

  // how deep is the subtree counted by subtree
  const depthOfSubtree = Math.floor(depth / SubtreeDepth)
  const depthInSubtree = depth % SubtreeDepth

  // how wide is the subtree for given depth
  const widthOfSubtreeAtDepth = pow2(BigInt(depthInSubtree))
  // what is the index of the subtree we should write to
  const indexOfSubtree = index / widthOfSubtreeAtDepth
  // what is the index in subtree
  const indexInSubtree = widthOfSubtreeAtDepth + (index % widthOfSubtreeAtDepth)

  const offsetOfSubtreeLayer =
    (pow2(BigInt(depthOfSubtree + 1) * BigInt(SparseBlockLog2Size)) - 1n) /
      (BigIntSparseBlockSize - 1n) -
    1n

  const offsetOfSubtree =
    offsetOfSubtreeLayer + BigIntSparseBlockSize * indexOfSubtree

  return offsetOfSubtree + indexInSubtree
}
