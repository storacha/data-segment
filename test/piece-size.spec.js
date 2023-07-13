import { PaddedSize, UnpaddedSize } from '@web3-storage/data-segment/piece'

// Tests here were ported from
// @see https://github.com/filecoin-project/go-state-types/blob/master/abi/piece_test.go

const vector = [
  [127, 128],
  [1016, 1024],
  [34091302912, 34359738368],
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
