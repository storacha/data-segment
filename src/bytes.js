/**
 * Compares if two byte arrays contain same data.
 *
 * @param {Uint8Array} actual
 * @param {Uint8Array} expected
 */
export const equal = (actual, expected) => {
  const { length } = actual

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
