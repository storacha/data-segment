import * as API from './api.js'

// @see https://github.com/filecoin-project/go-state-types/blob/master/abi/piece.go#L12

/**
 * @typedef {{ size: API.PaddedPieceSize, pieceCID: string }} PieceInfo
 */

/**
 * @param {number} size
 * @returns {API.PaddedPieceSize}
 */
export const toPaddedSize = (size) => size + Math.floor(size / 127)

/**
 * @param {number} size
 * @returns {API.PaddedPieceSize}
 */
export const PaddedPieceSize = (size) => {
  const result = validatePaddedPieceSize(size)
  if (result.error) {
    throw result.error
  } else {
    return result.ok
  }
}

/**
 *
 * @param {number} size
 */
export const UnpaddedPieceSize = (size) => {
  const result = validateUnpaddedPieceSize(size)
  if (result.error) {
    throw result.error
  } else {
    return result.ok
  }
}

/**
 * @param {number} size
 * @returns {API.Result<API.UnpaddedPieceSize, Error>}
 */
export const validateUnpaddedPieceSize = (size) => {
  if (size < 127) {
    return { error: new Error('minimum piece size is 127 bytes') }
  }

  if (size >> countTrailingZeros(size) !== 127) {
    return {
      error: new Error(
        'Unpadded piece size must be a power of 2 multiple of 127'
      ),
    }
  }

  return { ok: size }
}

/**
 *
 * @param {number} value
 */
const countTrailingZeros = (value) => {
  if (value === 0) {
    return 32
  }

  let count = 0
  while ((value & 1) === 0) {
    value >>= 1
    count++
  }

  return count
}

/**
 * @param {API.PaddedPieceSize} s
 * @returns {API.UnpaddedPieceSize}
 */
export const unpadded = (s) => s - Math.floor(s / 128)

/**
 * @param {number} size
 * @returns {API.Result<API.PaddedPieceSize, RangeError>}
 */
export const validatePaddedPieceSize = (size) => {
  if (size < 128) {
    return { error: RangeError('minimum padded piece size is 128 bytes') }
  }

  if (Math.log2(size) % 1 !== 0) {
    return { error: Error('padded piece size must be a power of 2') }
  }

  return { ok: size }
}
