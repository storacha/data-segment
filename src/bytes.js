/**
 * Returns true if both byte arrays contain same bytes.
 *
 * @param {Uint8Array} actual
 * @param {Uint8Array} expected
 */
export const equal = (actual, expected) => {
  const { length } = actual

  /* c8 ignore next 3 */
  if (length !== expected.length) {
    return false
  }

  let offset = 0

  while (offset < length) {
    if (actual[offset] !== expected[offset]) {
      return false
    }

    offset++
  }

  return true
}
