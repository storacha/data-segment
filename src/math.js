/**
 * Returns the base 2 logarithm of the given `n`, rounded down.
 *
 * @param {bigint} n
 * @returns {number}
 */
export const log2Floor = (n) => {
  let result = 0n
  while ((n >>= 1n)) result++
  return Number(result)
}

/**
 * Return the integer logarithm with ceiling for 64 bit unsigned ints.
 *
 * @param {bigint|number} n
 */
export const log2Ceil = (n) => (n <= 1n ? 0 : log2Floor(BigInt(n) - 1n) + 1)

/**
 * @param {bigint} n
 */
export const trailingZeros64 = (n) => {
  if (n === 0n) {
    return 64
  }

  let count = 0
  while ((n & 1n) === 0n) {
    n >>= 1n
    count++
  }

  return count
}

/**
 * @param {bigint} value
 */
export const onesCount64 = (value) => {
  let count = 0
  const mask = 1n

  for (let i = 0n; i < 64n; i++) {
    if ((value & (mask << i)) !== 0n) {
      count++
    }
  }

  return count
}
