/**
 * Number of bits per byte
 */
const BITS_PER_BYTE = 8

/**
 * The number of Frs per Block.
 */
const FRS_PER_QUAD = 4
/**
 * The amount of bits in an Fr when not padded.
 */
const IN_BITS_FR = 254
/**
 * The amount of bits in an Fr when padded.
 */
const OUT_BITS_FR = 256

const IN_BYTES_PER_QUAD =
  /** @type {127} */
  ((FRS_PER_QUAD * IN_BITS_FR) / BITS_PER_BYTE)

const OUT_BYTES_PER_QUAD =
  /** @type {128} */
  ((FRS_PER_QUAD * OUT_BITS_FR) / BITS_PER_BYTE)

const BYTES_PER_FR =
  /** @type {32} */
  OUT_BYTES_PER_QUAD / FRS_PER_QUAD

/**
 * Derives fr32 padded size from the source content size (that MUST be
 * multiples of {@link IN_BYTES_PER_QUAD}) in bytes.
 *
 * @param {number} size
 */
const paddedSize = (size) => (size / IN_BYTES_PER_QUAD) * OUT_BYTES_PER_QUAD

/**
 * Takes source (zero padded) bytes that contain multiple chunks of 127 bytes
 * each and pads each chunk to 128 bytes.
 *
 *
 * @param {Uint8Array} source
 * @param {Uint8Array} output
 * @returns {Uint8Array}
 */
export const pad = (
  source,
  output = new Uint8Array(paddedSize(source.length))
) => {
  // Calculate number of quads in the given source
  const quadCount = source.length / IN_BYTES_PER_QUAD

  // Cycle over four(4) 31-byte groups, leaving 1 byte in between:
  // 31 + 1 + 31 + 1 + 31 + 1 + 31 = 127
  for (let n = 0; n < quadCount; n++) {
    const readOffset = n * IN_BYTES_PER_QUAD
    const writeOffset = n * OUT_BYTES_PER_QUAD

    // First 31 bytes + 6 bits are taken as-is (trimmed later)
    output.set(source.subarray(readOffset, readOffset + 32), writeOffset)

    // first 2-bit "shim" forced into the otherwise identical output
    output[writeOffset + 31] &= 0b00111111

    // copy next Fr32 preceded with the last two bits of the previous Fr32
    for (let i = 32; i < 64; i++) {
      output[writeOffset + i] =
        (source[readOffset + i] << 2) | (source[readOffset + i - 1] >> 6)
    }

    // next 2-bit shim
    output[writeOffset + 63] &= 0b00111111

    for (let i = 64; i < 96; i++) {
      output[writeOffset + i] =
        (source[readOffset + i] << 4) | (source[readOffset + i - 1] >> 4)
    }

    // next 2-bit shim
    output[writeOffset + 95] &= 0b00111111

    for (let i = 96; i < 127; i++) {
      output[writeOffset + i] =
        (source[readOffset + i] << 6) | (source[readOffset + i - 1] >> 2)
    }

    // we shim last 2-bits by shifting the last byte by two bits
    output[writeOffset + 127] = source[readOffset + 126] >> 2
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
