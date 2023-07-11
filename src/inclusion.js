import * as API from './api.js'
import { maxIndexEntriesInDeal, EntrySize } from './index.js'

/**
 *
 * @param {API.PaddedPieceSize} size
 * @returns {API.uint64}
 */
export const indexAreaStart = (size) =>
  size - BigInt(maxIndexEntriesInDeal(size)) * EntrySize
