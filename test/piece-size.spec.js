import { PaddedSize, UnpaddedSize } from '@web3-storage/data-segment/piece'
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
      `UnpaddedSize.from(${size})`,
      (assert) => {
        assert.deepEqual(UnpaddedSize.from(size), BigInt(size))
      },
    ])
  ),
  ...Object.fromEntries(
    vector.map(([, size]) => [
      `PaddedSize.from(${size})`,
      (assert) => {
        assert.deepEqual(PaddedSize.from(size), BigInt(size))
      },
    ])
  ),
  // convert
  ...Object.fromEntries(
    vector.map(([unpadded, padded]) => [
      `PaddedSize.toUnpaddedSize(PaddedSize.from(${padded})) === ${unpadded}`,
      (assert) => {
        assert.deepEqual(
          PaddedSize.toUnpaddedSize(PaddedSize.from(padded)),
          BigInt(unpadded)
        )
      },
    ])
  ),
  ...Object.fromEntries(
    vector.map(([unpadded, padded]) => [
      `UnpaddedSize.toPaddedSize(UnpaddedSize.from(${unpadded})) === ${padded}`,
      (assert) => {
        assert.deepEqual(
          UnpaddedSize.toPaddedSize(UnpaddedSize.from(unpadded)),
          BigInt(padded)
        )
      },
    ])
  ),
  // round trip
  ...Object.fromEntries(
    [127, 1016, 34091302912].map((size) => [
      `PaddedSize.validate(UnpaddedSize.toPaddedSize(UnpaddedSize.from(${size})))`,
      (assert) => {
        assert.equal(
          PaddedSize.toUnpaddedSize(
            UnpaddedSize.toPaddedSize(UnpaddedSize.from(size))
          ),
          BigInt(size)
        )
      },
    ])
  ),
  ...Object.fromEntries(
    [128, 1024, 34359738368].map((size) => [
      `UnpaddedSize.toPaddedSize(PaddedSize.toUnpaddedSize(PaddedSize.from(${size})))) === ${size}`,
      (assert) => {
        assert.equal(
          UnpaddedSize.toPaddedSize(
            PaddedSize.toUnpaddedSize(PaddedSize.from(size))
          ),
          BigInt(size)
        )
      },
    ])
  ),

  // to height - from height
  ...Object.fromEntries(
    [128, 1024, 34359738368].map((size) => [
      `PaddedSize.fromHeight(PaddedSize.toHeight(PaddedSize.from(${size})))) === ${size}`,
      (assert) => {
        assert.equal(
          PaddedSize.fromHeight(PaddedSize.toHeight(PaddedSize.from(size))),
          BigInt(size)
        )
      },
    ])
  ),

  ...Object.fromEntries(
    [127, 1016, 34091302912].map((size) => [
      `UnpaddedSize.toHeight(${size})`,
      (assert) => {
        assert.equal(
          PaddedSize.fromHeight(UnpaddedSize.toHeight(UnpaddedSize.from(size))),
          UnpaddedSize.toPaddedSize(UnpaddedSize.from(size))
        )
      },
    ])
  ),

  // throw
  ...Object.fromEntries(
    [9, 128, 99453687, 1016 + 0x1000000].map((size) => [
      `UnpaddedSize.from(${size}) throws`,
      (assert) => {
        assert.throws(() => UnpaddedSize.from(size))
      },
    ])
  ),
  ...Object.fromEntries(
    [8, 127, 99453687, 0xc00, 1025].map((size) => [
      `PaddedSize.from(${size}) throws`,
      (assert) => {
        assert.throws(() => PaddedSize.from(size))
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
        `UnpaddedSize.requiredZeroPadding(${size}) === ${expect}`,
        (assert) => {
          assert.equal(
            UnpaddedSize.requiredZeroPadding(BigInt(size)),
            BigInt(expect)
          )
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
        `UnpaddedSize.toWidth(${size}) === ${expect}`,
        (assert) => {
          assert.equal(UnpaddedSize.toWidth(BigInt(size)), BigInt(expect))
        },
      ]
    })
  ),
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
