import process from 'node:process'
import { deriveBuffer } from '../test/util.js'
import SHA256 from 'sync-multihash-sha2/sha256'
import * as raw from 'multiformats/codecs/raw'
import { create as createLink } from 'multiformats/link'

/**
 * @param  {number} size
 * @param {string} seed
 */
const main = (size = 1024, ...args) => {
  const buffer = deriveBuffer(size)

  if (args.includes('--cid')) {
    const link = createLink(raw.code, SHA256.digest(buffer))
    console.log(link.toString())
  } else {
    process.stdout.write(buffer)
  }
}

// @ts-expect-error
main(...process.argv.slice(2))
