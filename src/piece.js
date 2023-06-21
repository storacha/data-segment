import * as API from './api.js'

// @see https://github.com/filecoin-project/go-state-types/blob/master/abi/piece.go#L12

/**
 * @typedef {{ size: API.PaddedPieceSize, pieceCID: string }} PieceInfo
 */

/**
 * @param {number} s
 * @returns {API.PaddedPieceSize}
 */
export const padded = (s) => s + Math.floor(s / 127)

/**
 * @param {number} s
 * @returns {Error|null}
 */
export const validateUnpaddedPieceSize = (s) => {
  if (s < 127) {
    return new Error('minimum piece size is 127 bytes')
  }

  if (s >> Math.clz32(s) !== 127) {
    return new Error('unpadded piece size must be a power of 2 multiple of 127')
  }

  return null
}

/**
 * @param {API.PaddedPieceSize} s
 * @returns {API.UnpaddedPieceSize}
 */
export const unpadded = (s) => s - Math.floor(s / 128)

/**
 * @param {API.PaddedPieceSize} s
 * @returns {Error|null}
 */
export const validatePaddedPieceSize = (s) => {
  if (s < 128) {
    return new Error('minimum padded piece size is 128 bytes')
  }

  if (Math.clz32(s) !== 1) {
    return new Error('padded piece size must be a power of 2')
  }

  return null
}
