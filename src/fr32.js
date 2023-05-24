/**
 * @param {Uint8Array} source
 * @param {Uint8Array} output
 * @returns {Uint8Array}
 */
export const pad = (
  source,
  output = new Uint8Array((source.length / 127) * 128)
) => {
  // Calculate the number of chunks and the size of the output array
  const chunks = source.length / 127

  for (let chunk = 0; chunk < chunks; chunk++) {
    const inOff = chunk * 127
    const outOff = chunk * 128

    output.set(source.subarray(inOff, inOff + 31), outOff)

    let t = source[inOff + 31] >> 6
    output[outOff + 31] = source[inOff + 31] & 0x3f
    let v = 0

    for (let i = 32; i < 64; i++) {
      v = source[inOff + i]
      output[outOff + i] = (v << 2) | t
      t = v >> 6
    }

    t = v >> 4
    output[outOff + 63] &= 0x3f

    for (let i = 64; i < 96; i++) {
      v = source[inOff + i]
      output[outOff + i] = (v << 4) | t
      t = v >> 4
    }

    t = v >> 2
    output[outOff + 95] &= 0x3f

    for (let i = 96; i < 127; i++) {
      v = source[inOff + i]
      output[outOff + i] = (v << 6) | t
      t = v >> 2
    }

    output[outOff + 127] = t & 0x3f
  }

  return output
}

/**
 * Expects `inBytes.length % 128 === 0` and `out.length % 127 === 0`
 *
 * @param {Uint8Array} inBytes
 * @param {Uint8Array} out
 */
/* c8 ignore next 51 */
export const unpad = (inBytes, out) => {
  const chunks = inBytes.length / 128
  for (let chunk = 0; chunk < chunks; chunk++) {
    const inOffNext = chunk * 128 + 1
    const outOff = chunk * 127

    let at = inBytes[chunk * 128]

    for (let i = 0; i < 32; i++) {
      const next = inBytes[i + inOffNext]

      out[outOff + i] = at

      at = next
    }

    out[outOff + 31] |= at << 6

    for (let i = 32; i < 64; i++) {
      const next = inBytes[i + inOffNext]

      out[outOff + i] = at >> 2
      out[outOff + i] |= next << 6

      at = next
    }

    out[outOff + 63] ^= (at << 6) ^ (at << 4)

    for (let i = 64; i < 96; i++) {
      const next = inBytes[i + inOffNext]

      out[outOff + i] = at >> 4
      out[outOff + i] |= next << 4

      at = next
    }

    out[outOff + 95] ^= (at << 4) ^ (at << 2)

    for (let i = 96; i < 127; i++) {
      const next = inBytes[i + inOffNext]

      out[outOff + i]
      out[outOff + i] = at >> 6
      out[outOff + i] |= next << 2

      at = next
    }
  }
}
