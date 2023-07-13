import * as API from './api.js'
import * as Hybrid from './hybrid.js'
import * as Segment from './segment.js'
import * as Index from './index.js'
import * as Piece from './piece.js'
import * as Node from './node.js'
import { log2Ceil } from './uint64.js'
import { indexAreaStart } from './inclusion.js'

const NodeSize = BigInt(Node.Size)
const EntrySize = Number(Index.EntrySize)
export const MAX_CAPACITY = 2n ** BigInt(Hybrid.MAX_LOG2_LEAFS) * NodeSize

/**
 * Our default aggregate size is 32GiB is chosen based on current
 * average rate. 
 */
export const DEFAULT_DEAL_SIZE = Piece.PaddedSize.from(2n ** 35n) // 32 GiB

export const { PaddedSize, UnpaddedSize } = Piece

/**
 * @param {object} [options]
 * @param {API.PaddedPieceSize} [options.size] - Size of the aggregate in
 * (fr32 padded) bytes. If omitted default to 32 GiB which is a good
 * default because deals 8GiB and smaller are too expensive for service
 * providers to bother. The 16GiB deals may be an option, however our
 * current average rate of 30 GiB per hour suggests that 32 GiB is a
 * better default.
 */
export const createBuilder = ({ size = DEFAULT_DEAL_SIZE } = {}) =>
  new AggregateBuilder({ size })

/**
 * @param {object} options
 * @param {API.PieceInfo[]} options.pieces - Pieces to add to the aggregate
 * @param {API.PaddedPieceSize} [options.size] - Size of the aggregate in
 * (fr32 padded) bytes. If omitted default to 32 GiB
 */
export const build = ({ pieces, size = DEFAULT_DEAL_SIZE }) => {
  const builder = createBuilder({ size })

  for (const piece of pieces) {
    builder.write(piece)
  }

  return builder.close()
}

class AggregateBuilder {
  /**
   * @param {object} source
   * @param {API.PaddedPieceSize} source.size
   * @param {API.uint64} [source.offset]
   * @param {API.MerkleTreeNodeSource[]} [source.parts]
   * @param {number} [source.limit]
   */
  constructor({
    size,
    limit = Index.maxIndexEntriesInDeal(size),
    offset = 0n,
    parts = [],
  }) {
    this.size = PaddedSize.from(size)
    this.offset = offset
    this.parts = parts

    /**
     * Maximum number of pieces that could be added to this aggregate.
     */
    this.limit = limit

    this._tree = null
  }

  /**
   * Size of the index in bytes.
   */
  get indexSize() {
    return this.limit * EntrySize
  }

  close() {
    const { size, parts, limit, offset } = this
    const indexStartNodes = indexAreaStart(size) / NodeSize

    /** @type {API.MerkleTreeNodeSource[]} */
    const batch = new Array(2 * parts.length)

    for (const [n, part] of parts.entries()) {
      const segment = Segment.fromSourceWithChecksum(part)
      const node = Segment.toIndexNode(segment)
      const index = n * 2
      batch[index] = {
        node: segment.root,
        location: {
          level: 0,
          index: indexStartNodes + BigInt(index),
        },
      }

      batch[index + 1] = {
        node,
        location: {
          level: 0,
          index: indexStartNodes + BigInt(index + 1),
        },
      }
    }

    const tree = Hybrid.create(log2Ceil(size / NodeSize))
    Hybrid.batchSet(tree, parts)
    Hybrid.batchSet(tree, batch)

    return new Aggregate({
      size,
      tree,
      offset,
      parts,
      limit,
    })
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
   *   offset: API.uint64
   * }, RangeError>}
   */
  estimate({ root, size }) {
    if (this.parts.length >= this.limit) {
      return {
        error: new RangeError(
          `Too many pieces for a ${this.size} sized aggregate: ${
            this.parts.length + 1
          } > ${this.limit}`
        ),
      }
    }

    const result = PaddedSize.validate(size)
    if (result.error) {
      return result
    }

    const sizeInNodes = size / NodeSize
    const level = log2Ceil(sizeInNodes)

    const index = (this.offset + sizeInNodes - 1n) / sizeInNodes
    const offset = (index + 1n) * sizeInNodes

    const total = offset * NodeSize + BigInt(this.limit) * BigInt(EntrySize)
    if (total > this.size) {
      return {
        error: new RangeError(
          `"Pieces are too large to fit in the index: ${total} (packed pieces) + ${
            this.limit * EntrySize
          } (index) > ${this.size} (dealSize)"`
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
}

class Aggregate {
  /**
   * @param {object} source
   * @param {API.PaddedPieceSize} source.size
   * @param {API.uint64} source.offset
   * @param {API.MerkleTreeNodeSource[]} source.parts
   * @param {number} source.limit
   * @param {API.MerkleTree} source.tree
   */
  constructor({ tree, parts, limit, size, offset }) {
    this.tree = tree
    this.parts = parts
    this.limit = limit
    this.size = size
    this.offset = offset
  }
  /**
   * Size of the index in bytes.
   */
  get indexSize() {
    return this.limit * EntrySize
  }
  link() {
    return Piece.createLink(this.tree.root)
  }
  toJSON() {
    return {
      link: { '/': this.link().toString() },
      // Note that currently our aggregate size is always 32GiB and that is
      // below the `Number.MAX_SAFE_INTEGER` so we can safely convert it to
      // a number. Even if we were to use larger aggregates, we could still
      // serialize them as number it's just it would be unsafe to use perform
      // any arithmetic on them, they would have to be converted to back to
      // bigint first.
      size: Number(this.size),
    }
  }
}
