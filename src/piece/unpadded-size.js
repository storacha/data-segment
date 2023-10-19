import * as API from '../api.js'
import { log2Ceil, trailingZeros64 } from '../uint64.js'
import { FRS_PER_QUAD, IN_BYTES_PER_QUAD, NODE_SIZE } from '../constant.js'

const BYTES_PER_NODE = BigInt(NODE_SIZE)
const BYTES_PER_QUAD = BigInt(IN_BYTES_PER_QUAD)
const LEAFS_PER_QUAD = BigInt(FRS_PER_QUAD)

export {
  from,
  toExpanded as toPaddedSize,
  toHeight,
  fromHeight,
} from '../size/padded.js'

export { toPadding as requiredZeroPadding, toWidth } from '../size/unpadded.js'
// /**
//  * Validates that given `size` is a valid {@link API.UnpaddedPieceSize} and
//  * returns {@link API.UnpaddedPieceSize} capturing the validation at the type
//  * level. If given `size` is not a valid `UnpaddedPieceSize` throws an error.
//  *
//  * This function is a variation on {@link validate} that throws exceptions
//  * instead of returning a {@link API.Result}.
//  *
//  * @param {number|API.uint64} size
//  * @returns {API.UnpaddedPieceSize}
//  */
// export const from = (size) => {
//   const result = validate(BigInt(size))
//   if (result.error) {
//     throw result.error
//   } else {
//     return result.ok
//   }
// }

// /**
//  * Validates that given `size` is a valid {@link API.UnpaddedPieceSize} that is
//  * a power of 2 multiple of 127. Returns {@link API.Result} with
//  * `UnpaddedPieceSize` ok case and an Error in the error case.
//  *
//  * @param {API.uint64} size
//  * @returns {API.Result<API.UnpaddedPieceSize, Error>}
//  */
// export const validate = (size) => {
//   if (size < BYTES_PER_QUAD) {
//     return {
//       error: new Error(`Minimum piece size is ${BYTES_PER_QUAD} bytes`),
//     }
//   }

//   if (size >> BigInt(trailingZeros64(size)) !== BYTES_PER_QUAD) {
//     return {
//       error: new Error(
//         `Unpadded piece size must be a power of 2 multiple of ${BYTES_PER_QUAD}, got ${size} instead`
//       ),
//     }
//   }

//   return { ok: size }
// }

// /**
//  * Takes `{@link API.UnpaddedPieceSize}` and returns corresponding
//  * {@link API.PieceSize}.
//  *
//  * Please note that this function does not validate the input size and
//  * relies that type-checker will ensure that user passes valid unpadded
//  * piece size created with {@link from} or {@link validate} functions.
//  *
//  *
//  * @see https://github.com/filecoin-project/go-state-types/blob/master/abi/piece.go#L14-L16
//  *
//  * @param {API.UnpaddedPieceSize} size
//  * @returns {API.PieceSize}
//  */
// export const toPaddedSize = (size) => size + size / BYTES_PER_QUAD

// /**
//  * Calculates the height of the piece tree from unpadded size.
//  *
//  * @param {API.UnpaddedPieceSize} size
//  */
// export const toHeight = (size) => log2Ceil(toPaddedSize(size) / BYTES_PER_NODE)

// /**
//  * Calculates the padded size of the piece from the given tree height.
//  *
//  * @param {number} height
//  * @returns {API.uint64}
//  */
// export const fromHeight = (height) => {
//   // We calculate number of quads tree by calculating number of nodes tree
//   // at second layer. This works because we deal with a binary tree so first
//   // layer nodes will contain 2 leaves and second layer nodes will contain 4
//   // leaves hence number of quads.
//   const quads = 2n ** BigInt(height - 2)
//   return quads * BYTES_PER_QUAD
// }

// /**
//  *
//  * @param {API.uint64} payloadSize
//  */
// export const requiredZeroPadding = (payloadSize) => {
//   const quadCount = toWidth(payloadSize) / LEAFS_PER_QUAD
//   const paddedSize = quadCount * BYTES_PER_QUAD
//   return paddedSize - payloadSize
// }

// /**
//  * Counts number of leaves required to fit the given payload.
//  *
//  * @param {API.uint64} payloadSize
//  */
// export const toWidth = (payloadSize) => {
//   // Number of quads that would fit in the given payload size
//   // Since bigint division will truncate we add 1 shy of another quads worth to
//   // compensate for the truncation.
//   let quadCount = (payloadSize + BYTES_PER_QUAD - 1n) / BYTES_PER_QUAD

//   return 2n ** BigInt(log2Ceil(quadCount)) * LEAFS_PER_QUAD
// }
