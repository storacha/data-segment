import process from 'node:process'
import { deriveBuffer } from '../test/util.js'

/**
 * @param  {number} size
 * @param {string} seed
 */
const main = async (size = 1024, seed = 'hello world') => {
  const buffer = await deriveBuffer(seed, size)
  process.stdout.write(buffer)
}

// @ts-expect-error
main(...process.argv.slice(2, 4))
