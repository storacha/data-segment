import { log2Ceil, log2Floor, trailingZeros64 } from '../src/math.js'

/** @type {import("entail").Suite} */
export const testLog2Ceil = Object.fromEntries(
  [
    [0, 0],
    [1, 0],
    [2, 1],
    [3, 2],
    [4, 2],
    [7, 3],
    [9, 4],
    [0xffffffffffffffff, 64],
    [18446744073709551614, 64],
  ].map(([n, expect]) => [
    `log2Ceil(${n}) === ${expect}`,
    (assert) => {
      assert.equal(log2Ceil(n), expect)
    },
  ])
)

/** @type {import("entail").Suite} */
export const testLog2Floor = Object.fromEntries(
  /** @type {[bigint, number][]} */
  ([
    [0n, 0],
    [1n, 0],
    [2n, 1],
    [3n, 1],
    [4n, 2],
    [7n, 2],
    [8n, 3],
    [9n, 3],
    [1n << (63n - 1n), 62],
    [1n << (64n - 1n), 63],
    [0xffffffffffffffffn, 63],
  ]).map(([n, expect]) => [
    `log2Floor(${n}) === ${expect}`,
    (assert) => {
      assert.equal(log2Floor(n), expect)
    },
  ])
)

/** @type {import("entail").Suite} */
export const testTrailingZeros64 = {
  'trailingZeros64(0) === 64': (assert) => {
    assert.equal(trailingZeros64(0n), 64)
  },
}
