import * as API from './api.js'
import { maxIndexEntriesInDeal, EntrySize } from './index.js'

/**
 *
 * @param {API.PaddedPieceSize} size
 */
export const indexAreaStart = (size) =>
  size - maxIndexEntriesInDeal(size) * EntrySize
