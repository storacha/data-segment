import {
  Padded,
  Unpadded,
  Expanded,
} from '@web3-storage/data-segment/piece/size'
import { varint } from 'multiformats'

// Tests here were ported from
// @see https://github.com/filecoin-project/go-state-types/blob/master/abi/piece_test.go

const vector = [
  [127, 128],
  [1016, 1024],
  [34091302912, 34359738368],
  [4261412864, 4294967296],
]

/**
 * @type {import("entail").Suite}
 */
export const testPieceSize = {
  ...Object.fromEntries(
    vector.map(([size]) => [
      `Padded.from(${size})`,
      (assert) => {
        assert.deepEqual(Padded.from(size), BigInt(size))
      },
    ])
  ),
  ...Object.fromEntries(
    vector.map(([, size]) => [
      `Expanded.from(${size})`,
      (assert) => {
        assert.deepEqual(Expanded.from(size), BigInt(size))
      },
    ])
  ),
  // convert
  ...Object.fromEntries(
    vector.map(([padded, expanded]) => [
      `Padded.fromExpanded(Expanded.from(${expanded})) === ${padded}`,
      (assert) => {
        assert.deepEqual(
          Padded.fromExpanded(Expanded.from(expanded)),
          BigInt(padded)
        )
      },
    ])
  ),
  ...Object.fromEntries(
    vector.map(([padded, expanded]) => [
      `Padded.toExpanded(Padded.from(${padded})) === ${expanded}`,
      (assert) => {
        assert.deepEqual(
          Padded.toExpanded(Padded.from(padded)),
          BigInt(expanded)
        )
      },
    ])
  ),
  // round trip
  ...Object.fromEntries(
    [127, 1016, 34091302912].map((size) => [
      `Expanded.toPadded(Padded.toExpanded(Padded.from(${size})))`,
      (assert) => {
        assert.equal(
          Expanded.toPadded(Padded.toExpanded(Padded.from(size))),
          BigInt(size)
        )
      },
    ])
  ),
  ...Object.fromEntries(
    [128, 1024, 34359738368].map((size) => [
      `Padded.toExpanded(Expanded.toPadded(Expanded.from(${size}))) === ${size}`,
      (assert) => {
        assert.equal(
          Padded.toExpanded(Expanded.toPadded(Expanded.from(size))),
          BigInt(size)
        )
      },
    ])
  ),

  // to height - from height
  ...Object.fromEntries(
    [128, 1024, 34359738368].map((size) => [
      `Expanded.fromHeight(Expanded.toHeight(Expanded.from(${size}))) === ${size}`,
      (assert) => {
        assert.equal(
          Expanded.fromHeight(Expanded.toHeight(Expanded.from(size))),
          BigInt(size)
        )
      },
    ])
  ),

  ...Object.fromEntries(
    [127, 1016, 34091302912].map((size) => [
      `Padded.toHeight(${size})`,
      (assert) => {
        assert.equal(
          Expanded.fromHeight(Padded.toHeight(Padded.from(size))),
          Padded.toExpanded(Padded.from(size))
        )
      },
    ])
  ),

  // throw
  ...Object.fromEntries(
    [9, 128, 99453687, 1016 + 0x1000000].map((size) => [
      `Padded.from(${size}) throws`,
      (assert) => {
        assert.throws(() => Padded.from(size))
      },
    ])
  ),
  ...Object.fromEntries(
    [8, 127, 99453687, 0xc00, 1025].map((size) => [
      `Expanded.from(${size}) throws`,
      (assert) => {
        assert.throws(() => Expanded.from(size))
      },
    ])
  ),
}

/**
 * @type {import("entail").Suite}
 */
export const testZeroPadding = {
  ...Object.fromEntries(
    [
      [0n, 127n],
      [1n, 126n],
      [5n, 122n],
      [11n, 116n],
      [127n, 0n],
      [128n, 127n - 1n],
      [127 * 2 - 1, 1],
      [127 * 2, 0],
      [127 * 2 + 1, 127 * 2 - 1],
      [127 * 3, 127],
      [127 * 4, 0],
      // [127 * 4 + 1, 8 * 4],
      [127 * 4 + 10, 127 * 8 - 127 * 4 - 10],
      [128 * 4, 504],
      [17873661021126657n, 17873661021126655n],
    ].map(([size, expect]) => {
      return [
        `Unpadded.toPadding(${size}) === ${expect}`,
        (assert) => {
          assert.equal(Unpadded.toPadding(BigInt(size)), BigInt(expect))
        },
      ]
    })
  ),
}

/**
 * @type {import("entail").Suite}
 */
export const testWidth = {
  ...Object.fromEntries(
    [
      [128, 8],
      [127 * 4 + 1, 8 * 4],
      [0, 4],
      [1, 4],
      [5, 4],
      [11, 4],
      [127, 4],
      [128, 8],
      [127 * 2 - 1, 8],
      [127 * 2, 8],
      [127 * 2 + 1, 16],
      [127 * 3, 16],
      [127 * 4, 16],
      [127 * 4 + 10, 32],
      [128 * 4, 32],
      [128 * 8 + 1, 64],
    ].map(([size, expect]) => {
      return [
        `Unpadded.toWidth(${size}) === ${expect}`,
        (assert) => {
          assert.equal(Unpadded.toWidth(BigInt(size)), BigInt(expect))
        },
      ]
    })
  ),
}

/**
 * @type {import("entail").Suite}
 */
export const testUnpadded = {
  'test fromPiece': async (assert) => {
    assert.deepEqual(
      Unpadded.fromPiece({
        height: 2,
        padding: 15n,
      }),
      127n - 15n
    )
  },

  toExpanded: async (assert) => {
    assert.deepEqual(Unpadded.toExpanded(0n), 128n)
    assert.deepEqual(Unpadded.toExpanded(1n), 128n)
    assert.deepEqual(Unpadded.toExpanded(127n), 128n)
    assert.deepEqual(Unpadded.toExpanded(128n), 256n)
  },

  toHeight: async (assert) => {
    assert.deepEqual(Unpadded.toHeight(0n), 2)
    assert.deepEqual(Unpadded.toHeight(127n), 2)
    assert.deepEqual(Unpadded.toHeight(128n), 3)
    assert.deepEqual(Unpadded.toHeight(256n), 4)
  },
}

/**
 * @type {import("entail").Suite}
 */
export const testExpanded = {}

/**
 * @type {import("entail").Suite}
 */
export const testPadded = {
  fromHeight: async (assert) => {
    assert.deepEqual(Padded.fromHeight(2), 127n)
    assert.deepEqual(Padded.fromHeight(3), (256n / 128n) * 127n)
    assert.deepEqual(Padded.fromHeight(4), (512n / 128n) * 127n)
  },
  fromWidth: async (assert) => {
    assert.deepEqual(Padded.fromWidth(4n), 127n)
    assert.deepEqual(Padded.fromWidth(8n), (256n / 128n) * 127n)
  },
}

/**
 * @type {import("entail").Suite}
 */
export const testVarint = {
  testVarintDecode: async (assert) => {
    const [n, length] = varint.decode(
      new Uint8Array([129, 128, 128, 128, 128, 128, 224, 31])
    )

    assert.ok(n > Number.MAX_SAFE_INTEGER)

    const encoded = varint.encodeTo(n, new Uint8Array(length))
  },

  'skip NonSafeInteger': async (assert) => {
    const bytes = varint.encodeTo(2 ** 63 - 1, new Uint8Array(9))

    assert.deepEqual(varint.decode(bytes)[0], 2 ** 63 - 1)
  },
}
