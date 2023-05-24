const fr32oh = 254 / 256 // fr32 needs 2 bits per 256, so we make room for that

/**
 * @description Determine the piece size for a given block of data. Does not
 * account for Fr32 padding. A simple rounding up to the next pow2 size.
 * @param {number} size the size of the original resource
 * @param {boolean} next bump to the _next_ pow2 piece size
 * @returns {number}
 */
export function pieceSizeFromRaw(size, next = false) {
  return 1 << (size.toString(2).length + (next ? 1 : 0))
}

/**
 * @description Determine the additional bytes of zeroed padding to append to the
 * end of a resource of `size` length in order to fit within a pow2 piece while
 * leaving enough room for Fr32 padding (2 bits per 254).
 * @param {number} size the size of the original resource
 * @returns {number}
 */
export function zeroPaddedSizeFromRaw(size) {
  const pieceSize = pieceSizeFromRaw(size)
  const bound = Math.ceil(fr32oh * pieceSize)
  // the size is either the closest pow2 number, or the next pow2 number if we don't have space for padding
  return size <= bound
    ? bound
    : Math.ceil(fr32oh * pieceSizeFromRaw(size, true))
}

/**
 * Adds additional zero-padding to the `source` at the end.
 *
 * @param {Uint8Array} source
 */
export const pad = (source) => {
  const size = zeroPaddedSizeFromRaw(source.byteLength)
  const output = new Uint8Array(size)
  output.set(source, 0)
  output.fill(0, source.byteLength)
  return output
}
