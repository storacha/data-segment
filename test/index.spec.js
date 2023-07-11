import * as Index from '../src/index.js'

/**
 * @type {import("entail").Suite}
 */
export const testIndex = {
  maxIndexEntriesInDeal: async (assert) => {
    assert.deepEqual(Index.maxIndexEntriesInDeal(0n), 4)
    assert.deepEqual(Index.maxIndexEntriesInDeal(100_000_000n), 1024)
    assert.deepEqual(Index.maxIndexEntriesInDeal(1_000_000_000n), 8192)
    assert.deepEqual(Index.maxIndexEntriesInDeal(10_000_000_000n), 131072)
    assert.deepEqual(Index.maxIndexEntriesInDeal(100_000_000_000n), 1048576)
    assert.deepEqual(Index.maxIndexEntriesInDeal(1_000_000_000_000n), 8388608)
    assert.deepEqual(
      Index.maxIndexEntriesInDeal(10_000_000_000_000n),
      134217728
    )
    assert.deepEqual(
      Index.maxIndexEntriesInDeal(100_000_000_000_000n),
      1073741824
    )
    assert.deepEqual(
      Index.maxIndexEntriesInDeal(1_000_000_000_000_000n),
      8589934592
    )
    assert.deepEqual(
      Index.maxIndexEntriesInDeal(0xffffffffffffffffn),
      140737488355328
    )
  },
}
