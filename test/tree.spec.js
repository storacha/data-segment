import { Tree } from '@web3-storage/data-segment'
import { base16 } from 'multiformats/bases/base16'

/**
 * @type {import("entail").Suite}
 */
export const testTree = {
  'throws on empty tree': async (assert) => {
    let result = null
    try {
      result = Tree.buildFromChunks([])
    } catch (error) {
      result = { catch: error }
    }

    assert.ok(String(Object(result).catch).includes('Empty source'))
  },

  'builds from chunks': async (assert) => {
    const tree = await Tree.compile(new Uint8Array(128))
    assert.equal(tree.depth, 3)
    assert.equal(tree.leafs.length, 4)
    assert.equal(tree.node(0, 0), tree.root)
    assert.equal(tree.leafCount, 4)
  },
}
