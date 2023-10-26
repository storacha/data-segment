import { Piece } from '@web3-storage/data-segment'
import { deriveBuffer } from './util.js'
import { parse as parseLink } from 'multiformats/link'
import * as Hasher from '../src/multihash.js'
import * as Digest from '../src/digest.js'
import * as Uint64 from '../src/uint64.js'
import * as Link from 'multiformats/link'
import * as Raw from 'multiformats/codecs/raw'
import { varint } from 'multiformats'

const prefix = varint.encodeTo(
  Hasher.code,
  new Uint8Array(varint.encodingLength(Hasher.code))
)

/**
 * Module is generated from `./commp.csv` using prepare script.
 * @see https://github.com/hugomrdias/playwright-test/issues/544
 */
import vector from './commp/vector.js'

/**
 * @type {import("entail").Suite}
 */
export const testMultihashCompat = {
  basic: async (assert) => {
    const hasher = Hasher.create()
    const bytes = new Uint8Array(65).fill(0)
    hasher.write(bytes)

    const digest = new Uint8Array(37)
    let count = hasher.digestInto(digest, 0, true)

    assert.deepEqual(count, prefix.length + 1 + 34)

    assert.deepEqual(
      digest,
      new Uint8Array([
        ...prefix,
        34, // size
        62, // padding
        2, // height
        55,
        49,
        187,
        153,
        172,
        104,
        159,
        102,
        238,
        245,
        151,
        62,
        74,
        148,
        218,
        24,
        143,
        77,
        220,
        174,
        88,
        7,
        36,
        252,
        111,
        63,
        214,
        13,
        253,
        72,
        131,
        51,
      ])
    )
  },

  testDigestWithOffset: async (assert) => {
    const hasher = Hasher.create()
    const bytes = new Uint8Array(65).fill(0)
    hasher.write(bytes)

    const digest = new Uint8Array(50)
    let byteOffset = 7
    let byteLength = hasher.digestInto(digest, byteOffset, true)

    assert.deepEqual(byteLength, prefix.length + 1 + 34)

    assert.deepEqual(
      digest.subarray(byteOffset, byteOffset + byteLength),
      new Uint8Array([
        ...prefix,
        34, // size
        62, // padding
        2, // height
        55,
        49,
        187,
        153,
        172,
        104,
        159,
        102,
        238,
        245,
        151,
        62,
        74,
        148,
        218,
        24,
        143,
        77,
        220,
        174,
        88,
        7,
        36,
        252,
        111,
        63,
        214,
        13,
        253,
        72,
        131,
        51,
      ])
    )
  },

  test0BytePayload: async (assert) => {
    const hasher = Hasher.create()
    const output = new Uint8Array(37)

    const end = hasher.digestInto(output, 0, true)
    const digest = Digest.fromBytes(output.subarray(0, end))

    assert.deepEqual(digest.code, Hasher.code)
    assert.deepEqual(digest.size, 34)
    assert.deepEqual(
      digest.bytes,
      new Uint8Array([
        ...prefix,
        34, // size,
        127, // padding
        2, // height
        55,
        49,
        187,
        153,
        172,
        104,
        159,
        102,
        238,
        245,
        151,
        62,
        74,
        148,
        218,
        24,
        143,
        77,
        220,
        174,
        88,
        7,
        36,
        252,
        111,
        63,
        214,
        13,
        253,
        72,
        131,
        51,
      ])
    )

    assert.deepEqual(Digest.toBytes(digest), digest.bytes)
    assert.deepEqual(
      Digest.toBytes({ digest: digest.digest.slice() }),
      digest.bytes
    )
    assert.equal(
      Link.create(Raw.code, digest).toString(),
      'bafkzcibcp4bdomn3tgwgrh3g532zopskstnbrd2n3sxfqbze7rxt7vqn7veigmy'
    )
  },

  test127BytePayload: async (assert) => {
    const hasher = Hasher.create()
    hasher.write(new Uint8Array(127).fill(0))
    const output = new Uint8Array(64)

    const end = hasher.digestInto(output, 0, true)
    const digest = Digest.fromBytes(output.subarray(0, end))

    assert.deepEqual(digest.code, Hasher.code)
    assert.deepEqual(digest.size, 34)
    assert.deepEqual(
      digest.bytes,
      new Uint8Array([
        ...prefix,
        digest.size, // size,
        0, // padding
        2, // height
        55,
        49,
        187,
        153,
        172,
        104,
        159,
        102,
        238,
        245,
        151,
        62,
        74,
        148,
        218,
        24,
        143,
        77,
        220,
        174,
        88,
        7,
        36,
        252,
        111,
        63,
        214,
        13,
        253,
        72,
        131,
        51,
      ])
    )
    assert.equal(
      Link.create(Raw.code, digest).toString(),
      'bafkzcibcaabdomn3tgwgrh3g532zopskstnbrd2n3sxfqbze7rxt7vqn7veigmy'
    )
  },

  test128BytePayload: async (assert) => {
    const hasher = Hasher.create()
    hasher.write(new Uint8Array(128).fill(0))
    const output = new Uint8Array(64)

    const end = hasher.digestInto(output, 0, true)
    const digest = Digest.fromBytes(output.subarray(0, end))

    assert.deepEqual(digest.code, Hasher.code)
    assert.deepEqual(digest.size, 34)
    assert.deepEqual(
      digest.bytes,
      new Uint8Array([
        ...prefix,
        digest.size, // size,
        126, // padding
        3, // height
        // root
        100,
        42,
        96,
        126,
        248,
        134,
        176,
        4,
        191,
        44,
        25,
        120,
        70,
        58,
        225,
        212,
        105,
        58,
        192,
        244,
        16,
        235,
        45,
        27,
        122,
        71,
        254,
        32,
        94,
        94,
        117,
        15,
      ])
    )
    assert.equal(
      Link.create(Raw.code, digest).toString(),
      'bafkzcibcpybwiktap34inmaex4wbs6cghlq5i2j2yd2bb2zndn5ep7ralzphkdy'
    )
  },

  testSpec127x4: async (assert) => {
    const hasher = Hasher.create()
    hasher.write(new Uint8Array(127).fill(0))
    hasher.write(new Uint8Array(127).fill(1))
    hasher.write(new Uint8Array(127).fill(2))
    hasher.write(new Uint8Array(127).fill(3))
    const output = new Uint8Array(64)

    const end = hasher.digestInto(output, 0, true)
    const digest = Digest.fromBytes(output.subarray(0, end))

    assert.deepEqual(digest.code, Hasher.code)
    assert.deepEqual(digest.size, 34)
    assert.deepEqual(
      digest.bytes,
      new Uint8Array([
        ...prefix,
        digest.size, // size,
        0, // padding
        4, // height
        73,
        109,
        174,
        12,
        201,
        226,
        101,
        239,
        229,
        160,
        6,
        232,
        6,
        38,
        165,
        220,
        92,
        64,
        158,
        93,
        49,
        85,
        193,
        57,
        132,
        202,
        246,
        200,
        213,
        207,
        214,
        5,
      ])
    )
    assert.equal(
      Link.create(Raw.code, digest).toString(),
      'bafkzcibcaaces3nobte6ezpp4wqan2age2s5yxcatzotcvobhgcmv5wi2xh5mbi'
    )
  },

  testSpec128x4: async (assert) => {
    const hasher = Hasher.create()
    hasher.write(new Uint8Array(127).fill(0))
    hasher.write(new Uint8Array(127).fill(1))
    hasher.write(new Uint8Array(127).fill(2))
    hasher.write(new Uint8Array(127).fill(3))
    hasher.write(new Uint8Array(128 * 4 - 127 * 4).fill(0))
    const output = new Uint8Array(64)

    const end = hasher.digestInto(output, 0, true)
    const digest = Digest.fromBytes(output.subarray(0, end))

    assert.deepEqual(digest.code, Hasher.code)
    assert.deepEqual(digest.size, 35)
    assert.deepEqual(
      digest.bytes,
      new Uint8Array([
        ...prefix,
        digest.size, // size,
        248,
        3, // padding
        5, // height
        222,
        104,
        21,
        220,
        179,
        72,
        132,
        50,
        21,
        169,
        77,
        229,
        50,
        149,
        75,
        96,
        190,
        85,
        10,
        75,
        236,
        110,
        116,
        85,
        86,
        101,
        233,
        165,
        236,
        78,
        15,
        60,
      ])
    )
    assert.equal(
      Link.create(Raw.code, digest).toString(),
      'bafkzcibd7abqlxticxolgseegik2stpfgkkuwyf6kufex3doorkvmzpjuxwe4dz4'
    )
  },
  ['testSpec128x4 + 1']: async (assert) => {
    const hasher = Hasher.create()
    hasher.write(new Uint8Array(127).fill(0))
    hasher.write(new Uint8Array(127).fill(1))
    hasher.write(new Uint8Array(127).fill(2))
    hasher.write(new Uint8Array(127).fill(3))
    hasher.write(new Uint8Array(128 * 4 - 127 * 4 + 1).fill(0))

    const output = new Uint8Array(64)

    const end = hasher.digestInto(output, 0, true)
    const digest = Digest.fromBytes(output.subarray(0, end))

    assert.deepEqual(digest.code, Hasher.code)
    assert.deepEqual(digest.size, 35)
    assert.deepEqual(
      digest.bytes,
      new Uint8Array([
        ...prefix,
        digest.size, // size,
        247,
        3, // padding
        5, // height
        222,
        104,
        21,
        220,
        179,
        72,
        132,
        50,
        21,
        169,
        77,
        229,
        50,
        149,
        75,
        96,
        190,
        85,
        10,
        75,
        236,
        110,
        116,
        85,
        86,
        101,
        233,
        165,
        236,
        78,
        15,
        60,
      ])
    )
    assert.equal(
      Link.create(Raw.code, digest).toString(),
      'bafkzcibd64bqlxticxolgseegik2stpfgkkuwyf6kufex3doorkvmzpjuxwe4dz4'
    )
  },
}

/**
 * @type {import("entail").Suite}
 */
export const testSpecCompat = {
  'test 32GiB case from spec': async (assert) => {
    const v1 = parseLink(
      'baga6ea4seaqao7s73y24kcutaosvacpdjgfe5pw76ooefnyqw4ynr3d2y6x2mpq'
    )
    const v2 = parseLink(
      `bafkzcibcaapao7s73y24kcutaosvacpdjgfe5pw76ooefnyqw4ynr3d2y6x2mpq`
    )
    // Empty 32 GiB piece
    const height = Piece.Size.toHeight(Uint64.pow2(35n))
    // create empty digest we will mutate it manually
    const digest = Hasher.digest(new Uint8Array(127))
    const { bytes } = digest
    // copy root from the v1 multihash
    bytes.set(v1.multihash.digest, bytes.length - 32)
    // copy height
    bytes[bytes.length - 32 - 1] = height
    // set padding to 0
    bytes[bytes.length - 32 - 1 - 1] = 0

    assert.equal(digest.height, height)
    assert.equal(digest.size, 34)
    assert.equal(digest.padding, 0n)
    assert.equal(v2.toString(), Piece.fromDigest(digest).link.toString())
  },
  'test 64GiB case from spec': async (assert) => {
    const v1 = parseLink(
      'baga6ea4seaqomqafu276g53zko4k23xzh4h4uecjwicbmvhsuqi7o4bhthhm4aq'
    )
    const v2 = parseLink(
      `bafkzcibcaap6mqafu276g53zko4k23xzh4h4uecjwicbmvhsuqi7o4bhthhm4aq`
    )
    // Empty 64 GiB piece
    const height = Piece.Size.toHeight(Uint64.pow2(36n))

    // create empty digest we will mutate it manually
    const digest = Hasher.digest(new Uint8Array(127))
    const { bytes } = digest
    // copy root from the v1 multihash
    bytes.set(v1.multihash.digest, bytes.length - 32)
    // copy height
    bytes[bytes.length - 32 - 1] = height
    // set padding to 0
    bytes[bytes.length - 32 - 1 - 1] = 0

    assert.equal(digest.height, height)
    assert.equal(digest.size, 34)
    assert.equal(digest.padding, 0n)
    assert.equal(v2.toString(), Piece.fromDigest(digest).link.toString())
  },
}
/**
 * @type {import("entail").Suite}
 */
export const testMultihash = {
  ...Object.fromEntries(
    Object.values(vector).map((data) => [
      `${data.in.contentSize}\t\t${data.in.cid}`,
      async (assert) => {
        const payload = deriveBuffer(data.in.contentSize)
        const root = parseLink(data.out.cid).multihash.digest
        const height = Piece.Size.toHeight(BigInt(data.out.paddedSize))

        {
          const digest = Hasher.digest(payload)
          assert.deepEqual(digest.root, root)
          assert.deepEqual(digest.code, 0x1011)
          assert.deepEqual(
            digest.name,
            'fr32-sha2-256-trunc254-padded-binary-tree'
          )
          assert.deepEqual(digest.height, height)
        }

        const hasher = Hasher.create()
        // do the chunked write
        {
          const offset = Math.floor(Math.random() * payload.byteLength)
          hasher.write(payload.subarray(0, offset))
          assert.deepEqual(hasher.count(), BigInt(offset))
          hasher.write(new Uint8Array())
          assert.deepEqual(hasher.count(), BigInt(offset))
          hasher.write(payload.subarray(offset))
          assert.deepEqual(hasher.count(), BigInt(payload.byteLength))

          assert.deepEqual(hasher.code, 0x1011)
          assert.deepEqual(
            hasher.name,
            'fr32-sha2-256-trunc254-padded-binary-tree'
          )

          const digest = hasher.digest()
          assert.deepEqual(digest.root, root)
          assert.deepEqual(digest.root, root)
          assert.deepEqual(digest.code, 0x1011)
          assert.deepEqual(
            digest.name,
            'fr32-sha2-256-trunc254-padded-binary-tree'
          )
          assert.deepEqual(digest.height, height)
        }

        // reset and retry
        hasher.reset()
        {
          assert.deepEqual(hasher.count(), 0n)
          const digest = hasher.write(payload).digest()
          assert.deepEqual(digest.root, root)
          assert.deepEqual(digest.height, height)
          assert.deepEqual(hasher.count(), BigInt(payload.byteLength))
        }
      },
    ])
  ),
}
