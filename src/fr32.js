import * as API from './api.js'

/**
 * @description Given an iterable of Uint8Array chunks, return a new iterable
 * of chunks that adds Fr32 padding. For every 254 bits, an additional 2 zero bits are added.
 *
 * @param {Iterable<Uint8Array>} source - a stream or async iterator
 * of the original source, zero-padded to an appropriate length to fit in a pow2
 * sized piece after Fr32 padding.
 * @returns {Iterable<Uint8Array>}
 */
export function* fr32Pad(source) {
  let bytes = 0 // number of bytes we've processed so far, used for tracking the 254 padding
  let align = 0 // as we bump by 2 bits per 254 we keep track of whether we're at 0, 2, 4, or 6
  let nc = [] // store bytes in this, turn into a Buffer once we've processed a chunk
  let leftover = 0 // as we overflow, we need to track the padding leftover for the next cycle

  for (const chunk of source) {
    for (let idx = 0; idx < chunk.length; idx++) {
      const byt = chunk[idx]
      let lo = -1
      let hi = -1

      if (++bytes % 32 === 0) {
        // we're at a padding byte, shift alignment
        align += 2
        if (align === 8) {
          // we've added a full byte's worth of padding, push the extra byte and start again
          align = 0
          nc.push(leftover)
          bytes++
          leftover = 0
        }
      }
      // in alignment cases 2, 4, 6 we split the byte into two parts
      switch (align) {
        case 0:
          // easy case, we're byte-aligned
          nc.push(byt)
          continue
        case 2:
          hi = byt >> 6
          lo = byt & 63
          break
        case 4:
          hi = byt >> 4
          lo = byt & 15
          break
        case 6:
          hi = byt >> 2
          lo = byt & 3
          break
      }

      // reassemble
      if (bytes % 32 === 0) {
        // we're at a padding byte, insert the low and the leftover with padding in between
        nc.push((lo << (align - 2)) | leftover)
      } else {
        // the low bits and leftover bits together
        nc.push((lo << align) | leftover)
      }

      leftover = hi // save the hi bits for the next cycle
    }

    // emit the padded version and reset
    yield new Uint8Array(nc)
    nc = []
  }

  // we've ended on an unaligned byte, shift and emit
  if (align !== 0) {
    nc.push(leftover << align)
    yield new Uint8Array(nc) // single byte
  }
}

/**
 * Expects assumes `inBytes.length % 127 == 0` and `out.length % 128 === 0`
 *
 * @param {Uint8Array} inBytes
 * @param {Uint8Array} out
 */
export const pad = (inBytes, out) => {
  const chunks = out.length / 128
  for (let chunk = 0; chunk < chunks; chunk++) {
    const inOff = chunk * 127
    const outOff = chunk * 128

    out.set(inBytes.subarray(inOff, inOff + 31), outOff)

    let t = inBytes[inOff + 31] >> 6
    out[outOff + 31] = inBytes[inOff + 31] & 0x3f
    let v = 0

    for (let i = 32; i < 64; i++) {
      v = inBytes[inOff + i]
      out[outOff + i] = (v << 2) | t
      t = v >> 6
    }

    t = v >> 4
    out[outOff + 63] &= 0x3f

    for (let i = 64; i < 96; i++) {
      v = inBytes[inOff + i]
      out[outOff + i] = (v << 4) | t
      t = v >> 4
    }

    t = v >> 2
    out[outOff + 95] &= 0x3f

    for (let i = 96; i < 127; i++) {
      v = inBytes[inOff + i]
      out[outOff + i] = (v << 6) | t
      t = v >> 2
    }

    out[outOff + 127] = t & 0x3f
  }
}

/**
 * Expects `inBytes.length % 128 === 0` and `out.length % 127 === 0`
 *
 * @param {Uint8Array} inBytes
 * @param {Uint8Array} out
 */
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
