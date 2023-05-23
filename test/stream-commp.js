import process from 'node:process'
import { deriveBuffer } from './util.js'
import * as CommP from '../src/commp.js'
import * as FS from 'node:fs'
// @ts-ignore
import commp from '@rvagg/fil-utils'

/**
 * @param  {Parameters<typeof deriveBuffer>} args
 */
const main = async (...args) => {
  try {
    const buffer = FS.readFileSync(process.stdin.fd)

    const result = await CommP.compile([buffer], buffer.length)

    const out = await commp(buffer, buffer.length)

    console.log(`ComPCid: ${result.link()}
  RodComPCid: ${CommP.toCID(out.commp)}
  Payload: ${result.size}
  Unpadded piece: ${result.paddedSize}
  Padded piece: ${result.pieceSize}`)
  } catch (err) {
    console.error(err)
  }
}

main(...process.argv.slice(2, 4))
