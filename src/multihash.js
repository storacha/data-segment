import * as API from './api.js'
import {
  IN_BYTES_PER_QUAD,
  OUT_BYTES_PER_QUAD,
  FR_RATIO,
  pad,
  MIN_PIECE_SIZE,
} from './fr32.js'
import * as Node from './node.js'
import * as ZeroPad from './zero-comm.js'
import * as Digest from 'multiformats/hashes/digest'
import * as Proof from './proof.js'
import { split } from './piece/tree.js'
import { log2Floor } from './uint64.js'

export const name = /** @type {const} */ (
  'fr32-sha2-256-trunc254-padded-binary-tree'
)

/** @type {API.MulticodecCode<0x1011, typeof name>} */
export const code = 0x1011

/**
 * The digest for the multihash is 33 bytes. The first byte defines the height
 * of the tree and the remaining 32 bytes are the sha-256 digest of the root
 * node.
 * @type {33}
 */
export const size = 33

/**
 * Since first byte in the digest is the tree height, the maximum height is 255.
 * @type {255}
 */
export const MAX_HEIGHT = 255

/**
 * Given that max size of the
 */
export const MAX_PAYLOAD_SIZE = 2 ** 255 * FR_RATIO

/**
 *
 * @param {Uint8Array} payload
 */
export const digest = (payload) => {
  const hasher = new Hasher()
  hasher.write(payload)
  return hasher.digest()
}

/**
 * @returns {API.StreamingHasher<typeof code, typeof size>}
 */
export const create = () => new Hasher()

/**
 * @typedef {[API.MerkleTreeNode[], ...API.MerkleTreeNode[][]]} Layers
 *
 * @implements {API.StreamingHasher<typeof code, typeof size>}
 */
class Hasher {
  constructor() {
    /**
     * The number of bytes written into the hasher.
     *
     * @private
     */
    this.bytesWritten = 0n

    /**
     * This buffer is used to accumulate bytes until we have enough to fill a
     * quad.
     *
     * ⚠️ Note that you should never read bytes past {@link offset} as those
     * are considered dirty and may contain garbage.
     *
     * @protected
     */
    this.buffer = new Uint8Array(IN_BYTES_PER_QUAD)

    /**
     * Offset is the number of bytes in we have written into the buffer. If
     * offset is 0 it means that the buffer is effectively empty. When `offset`
     * is equal to `this.buffer.length` we have a quad that can be processed.
     *
     * @protected
     */
    this.offset = 0

    /**
     * The layers of the tree. Each layer will contain the
     *
     * @type {Layers}
     */
    this.layers = [[]]
  }

  count() {
    return this.bytesWritten
  }

  /**
   *  Digest collapses the internal hash state and returns the resulting raw 32
   * bytes of commP
   */
  digest() {
    const { buffer, layers, offset } = this
    // If we have remaining bytes in the buffer we pad with zeros and turn
    // them into leaf nodes. Note that it is safe to mutate the buffer here
    // as bytes past `offset` are considered dirty.
    const nodes = offset > 0 ? split(pad(buffer.fill(0, offset))) : undefined
    const root = computedRoot(layers, nodes)

    return root
  }
  /**
   *
   * @param {Uint8Array} bytes
   */
  write(bytes) {
    const { buffer, offset, layers } = this
    const leaves = layers[0]
    const { length } = bytes
    if (length === 0) {
      return this
    } else if (this.bytesWritten + BigInt(length) > MAX_PAYLOAD_SIZE) {
      /* c8 ignore next 4 */
      throw new RangeError(
        `Writing ${length} bytes exceeds max payload size of ${MAX_PAYLOAD_SIZE}`
      )
    }
    // If we do not have enough bytes to fill a quad, just add them to the
    // buffer
    else if (offset + length < buffer.length) {
      buffer.set(bytes, offset)
      this.offset += length
      this.bytesWritten += BigInt(length)
      return this
    }
    // If we are here we have more or equal number of bytes to fill the buffer
    // in which case we fill it and process the rest.
    else {
      // Number of bytes required to fill the buffer
      const bytesRequired = buffer.length - offset
      // Fill the remainder of the buffer from the given bytes and then
      // create leaf from it
      buffer.set(bytes.subarray(0, bytesRequired), offset)
      leaves.push(...split(pad(buffer)))

      let readOffset = bytesRequired
      // Rest of the bytes are also sliced into quads and
      while (readOffset + IN_BYTES_PER_QUAD < length) {
        const quad = bytes.subarray(readOffset, readOffset + IN_BYTES_PER_QUAD)
        leaves.push(...split(pad(quad)))
        readOffset += IN_BYTES_PER_QUAD
      }

      // Remaining bytes are copied into the buffer
      this.buffer.set(bytes.subarray(readOffset), 0)
      this.offset = length - readOffset

      this.flush()

      this.bytesWritten += BigInt(length)
      return this
    }
  }
  flush() {
    const { layers } = this
    let height = 0
    while (height < layers.length) {
      const layer = layers[height]
      height += 1
      let index = 0
      while (index + 1 < layer.length) {
        const node = Proof.computeNode(layer[index], layer[index + 1])
        if (this.layers.length <= height) {
          this.layers[height] = [node]
        } else {
          this.layers[height].push(node)
        }
        index += 2
      }
      layer.splice(0, index)
    }
  }

  reset() {
    this.offset = 0
    this.bytesWritten = 0n
    this.layers = [[]]
    return this
  }

  dispose() {}
  get code() {
    return code
  }
  get size() {
    return size
  }
  get name() {
    return name
  }
}

/**
 * @param {Layers} layers
 * @param {API.MerkleTreeNode[]} [newNodes]
 */
const computedRoot = (layers, newNodes = []) => {
  // Note it is important that we do not mutate any of the layers otherwise
  // calling digest() will have a side-effect and produce wrong results.
  let height = 0
  while (height < layers.length || newNodes.length > 1) {
    const layer = layers[height] ?? []
    const nodes = newNodes.length ? [...layer, ...newNodes] : layer
    // We already copied the nodes from the previous layer so we can clear it
    // here in order to accumulate the new nodes for the next layer.
    newNodes.length = 0

    // If we have the odd number of nodes and we have not reached the top
    // layer, we have a bug in the code and we throw an error.
    if (nodes.length % 2 > 0 && height + 1 < layers.length) {
      nodes.push(ZeroPad.fromLevel(height))
    }

    // If we have 0 nodes in the current layer we just move up the tree.
    if (nodes.length === 0) {
      height += 1
    } else {
      let index = 0
      // Note that we have checked that we have an even number of nodes so
      // we will never end up with an extra node when consuming two at a time.
      while (index + 1 < nodes.length) {
        const left = nodes[index]
        const right = nodes[index + 1]
        const node = Proof.computeNode(left, right)
        newNodes.push(node)
        index += 2
      }
      height += 1
    }
  }

  return newNodes[0] ?? layers[layers.length - 1][0]
}
