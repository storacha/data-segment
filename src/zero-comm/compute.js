const MAX_D = 64
import * as Node from '../node.js'
import * as Proof from '../proof.js'

/**
 * Computes the empty commitment tree so that we can optimize proof computation
 * and simply use desired subarray.
 *
 * @see https://github.com/filecoin-project/go-data-segment/blob/master/merkletree/zero_comm_test.go
 *
 * @returns {Uint8Array} - bafkreiaw4uppnwwylocdm45bjgagmw7aynzrcbltpydd5vg4gxj72zikau
 */
export const compute = () => {
  let buffer = new Uint8Array(MAX_D * Node.Size)
  let node = Node.empty()
  let n = 1
  buffer.set(node, 0)

  while (n < MAX_D) {
    node = Proof.computeNode(node, node)
    buffer.set(node, n * Node.Size)
    n++
  }

  return buffer
}
