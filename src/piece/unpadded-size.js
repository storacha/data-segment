import * as API from '../api.js'

/**
 * Validates that given `size` is a valid {@link API.UnpaddedPieceSize} and
 * returns {@link API.UnpaddedPieceSize} capturing the validation at the type
 * level. If given `size` is not a valid `UnpaddedPieceSize` throws an error.
 *
 * This function is a variation on {@link validate} that throws exceptions
 * instead of returning a {@link API.Result}.
 *
 * @param {number} size
 * @returns {API.UnpaddedPieceSize}
 */
export const from = (size) => {
  const result = validate(size)
  if (result.error) {
    throw result.error
  } else {
    return result.ok
  }
}

/**
 * Validates that given `size` is a valid {@link API.UnpaddedPieceSize} that is
 * a power of 2 multiple of 127. Returns {@link API.Result} with
 * `UnpaddedPieceSize` ok case and an Error in the error case.
 *
 * @param {number} size
 * @returns {API.Result<API.UnpaddedPieceSize, Error>}
 */
export const validate = (size) => {
  if (size < 127) {
    return { error: new Error('Minimum piece size is 127 bytes') }
  }

  if (Math.log2(size / 127) % 1 !== 0) {
    return {
      error: new Error(
        `Unpadded piece size must be a power of 2 multiple of 127, got ${size} instead`
      ),
    }
  }

  return { ok: size }
}

/**
 * Takes `{@link API.UnpaddedPieceSize}` and returns corresponding
 * {@link API.PaddedPieceSize}.
 *
 * Please note that this function does not validate the input size and
 * relies that type-checker will ensure that user passes valid unpadded
 * piece size created with {@link from} or {@link validate} functions.
 *
 *
 * @see https://github.com/filecoin-project/go-state-types/blob/master/abi/piece.go#L14-L16
 *
 * @param {API.UnpaddedPieceSize} size
 * @returns {API.PaddedPieceSize}
 */
export const toPaddedSize = (size) => size + Math.floor(size / 127)
