import { vector } from './commp.vector.js'
import { deriveBuffer } from '../test/util.js'
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'
import * as raw from 'multiformats/codecs/raw'
import FS from 'node:fs/promises'

/** @type {any[]} */
const dataset = []

for (const data of Object.values(vector)) {
  const source = await deriveBuffer(data.seed, data.size)
  const digest = await sha256.digest(source)
  const cid = CID.createV1(raw.code, digest)

  dataset.push({
    in: {
      cid: cid.toString(),
      seed: data.seed,
      size: data.size,
    },
    out: {
      cid: data.cid,
      paddedSize: data.paddedSize,
      pieceSize: data.pieceSize,
    },
  })
}

await FS.writeFile(
  `./test/commp/vector.js`,
  `export default ${JSON.stringify(dataset, null, 2)}`
)
