import * as API from './api.js'
import * as Hybrid from './hybrid.js'
import * as Segment from './segment.js'
import * as Index from './index.js'
import * as Piece from './piece.js'
import { Size as NodeSize } from './node.js'
import { EntrySize } from './index.js'
import { log2Ceil } from './zero-comm.js'
import { indexAreaStart } from './inclusion.js'

/**
 * @param {number} capacity - Size of the aggregate in bytes.
 */
export const createBuilder = (capacity) =>
  new AggregateBuilder({ capacity: Piece.PaddedSize.from(capacity) })

class AggregateBuilder {
  /**
   * @param {object} source
   * @param {API.PaddedPieceSize} source.capacity
   * @param {number} [source.offset]
   * @param {API.MerkleTreeNodeSource[]} [source.parts]
   * @param {number} [source.limit]
   */
  constructor({
    capacity,
    limit = Index.maxIndexEntriesInDeal(capacity),
    offset = 0,
    parts = [],
  }) {
    this.capacity = capacity
    this.offset = offset
    this.parts = parts

    this.limit = limit

    this._tree = null
  }

  /**
   * Size of the index in bytes.
   */
  get indexSize() {
    return this.parts.length * EntrySize
  }
  get size() {
    return this.offset + this.limit * EntrySize
  }

  get indexStartNodes() {
    return indexAreaStart(this.capacity) / NodeSize
  }

  close() {
    const { indexStartNodes, parts } = this

    const batch = new Array(2 * parts.length)

    for (const [n, part] of parts.entries()) {
      const segment = Segment.fromSourceWithChecksum(part)
      const node = Segment.toIndexNode(segment)
      const index = n * 2
      batch[index] = {
        node: segment.root,
        location: {
          level: 0,
          index: indexStartNodes + index,
        },
      }

      batch[index + 1] = {
        node,
        location: {
          level: 0,
          index: indexStartNodes + index + 1,
        },
      }
    }

    Hybrid.batchSet(this.tree, batch)

    return this
  }

  link() {
    return Piece.createLink(this.tree.root)
  }

  /**
   * @param {API.PieceInfo} piece
   */
  write(piece) {
    const result = this.estimate(piece)
    if (result.error) {
      throw result.error
    } else {
      const { parts, offset } = result.ok
      const [part] = parts
      // If we have a tree we update it with the new node, otherwise we
      // just defer the update until we need the tree.
      if (this._tree) {
        const { node, location } = part
        this._tree.setNode(location.level, location.index, node)
      }

      this.offset += offset
      this.parts.push(part)
    }

    return this
  }

  /**
   * Computes addition to the current aggregate if it were to write
   * provided segment.
   *
   * @param {API.PieceInfo} piece
   * @returns {API.Result<{
   *   parts: [API.MerkleTreeNodeSource]
   *   offset: number
   * }, RangeError>}
   */
  estimate({ root, size }) {
    if (this.parts.length >= this.limit) {
      return {
        error: new RangeError(
          `Too many pieces for a ${this.capacity} sized aggregate: ${
            this.parts.length + 1
          } > ${this.limit}`
        ),
      }
    }

    const result = Piece.PaddedSize.validate(size)
    if (result.error) {
      return result
    }

    const sizeInNodes = size / NodeSize
    const level = log2Ceil(sizeInNodes)

    const index = Math.floor((this.offset + sizeInNodes - 1) / sizeInNodes)
    const offset = (index + 1) * sizeInNodes

    const total = offset * NodeSize + this.limit * EntrySize
    if (total > this.capacity) {
      return {
        error: new RangeError(
          `"Pieces are too large to fit in the index: ${total} (packed pieces) + ${
            this.limit * EntrySize
          } (index) > ${this.capacity} (dealSize)"`
        ),
      }
    }

    return {
      ok: {
        parts: [{ node: root, location: { level, index } }],
        offset: offset - this.offset,
      },
    }
  }

  get tree() {
    const { _tree } = this
    if (_tree) {
      return _tree
    } else {
      const tree = Hybrid.create(log2Ceil(this.capacity / NodeSize))
      Hybrid.batchSet(tree, this.parts)
      this._tree = tree
      return tree
    }
  }
}

// /**
//  * @param {number} size - deal size in bytes
//  * @param {API.PieceInfo[]} pieces
//  */
// export const create = (size, pieces) => {
//   const maxEntries = Index.maxIndexEntriesInDeal(size)
//   if (pieces.length > maxEntries) {
//     throw new RangeError(
//       `Too many pieces for a ${size} sized aggregate: ${pieces.length} > ${maxEntries}`
//     )
//   }

//   const { size: total, placement } = computeDealPlacement(pieces)

//   const requiredSize = total + maxEntries * EntrySize
//   if (requiredSize > size) {
//     throw new RangeError(
//       `"Pieces are too large to fit in the index: ${total} (packed pieces) + ${
//         maxEntries * EntrySize
//       } (index) > ${size} (dealSize)"`
//     )
//   }
// }

// /**
//  * Takes array of {@link API.PieceInfo}s and computes their placement in the
//  * tree and returns corresponding array of {@link API.MerkleTreeNodeSource}s.
//  *
//  * @param {API.PieceInfo[]} pieces
//  * @returns {{size: number, placement: API.MerkleTreeNodeSource[]}}
//  */
// export const computeDealPlacement = (pieces) => {
//   let offset = 0
//   const placement = []
//   for (const { root, size } of pieces) {
//     Piece.validatePaddedPieceSize(size)
//     const sizeInNodes = size / NodeSize
//     const level = log2Ceil(sizeInNodes)
//     const index = (offset + sizeInNodes - 1) / sizeInNodes

//     offset += (index + 1) * sizeInNodes

//     placement.push({ node: root, location: { level, index } })
//   }

//   return { size: offset * NodeSize, placement }
// }
