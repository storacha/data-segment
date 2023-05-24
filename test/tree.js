import * as Tree from '../src/tree.js'

/**
 * @type {import("./api.js").TestSuite}
 */
export const test = {
  'throws on empty tree': async (assert) => {
    const result = await Tree.buildFromChunks([]).catch((error) => ({
      catch: error,
    }))

    assert.ok(String(Object(result).catch).includes('Empty source'))
  },

  'builds from chunks': async (assert) => {
    const tree = await Tree.compile(new Uint8Array(128))
    assert.equal(tree.depth, 3)
    assert.equal(tree.leafs.length, 4)
    assert.equal(tree.node(0, 0), tree.root)
  },
}
