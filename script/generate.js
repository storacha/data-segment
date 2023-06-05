import process from 'node:process'
import { deriveBuffer } from '../test/util.js'
import { sha256 } from 'multiformats/hashes/sha2'
import * as raw from 'multiformats/codecs/raw'
import { create as createLink } from 'multiformats/link'

/**
 * @param  {number} size
 * @param {string} seed
 */
const main = async (size = 1024, ...args) => {
  const buffer = await deriveBuffer(size)

  if (args.includes('--cid')) {
    const link = createLink(raw.code, await sha256.digest(buffer))
    console.log(link.toString())
  } else {
    process.stdout.write(buffer)
  }
}

// @ts-expect-error
main(...process.argv.slice(2))
