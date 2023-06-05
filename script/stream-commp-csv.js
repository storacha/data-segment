import process from 'node:process'
import * as FS from 'node:fs'
import { deriveBuffer } from '../test/util.js'
import { sha256 } from 'multiformats/hashes/sha2'
import * as raw from 'multiformats/codecs/raw'
import * as Link from 'multiformats/link'

const main = async () => {
  const content = await readInput(process.stdin)

  const [, commp, payload, padded, piece] = content.toString().split('\n')

  const cid = commp.split(/\s+/)[1].trim()
  const size = parseInt(payload.split(/\s+/)[1].trim())
  const paddedSize = parseInt(padded.split(/\s+/)[2].trim())
  const pieceSize = parseInt(piece.split(/\s+/)[2].trim())

  const source = await deriveBuffer(size)
  const digest = await sha256.digest(source)
  const link = Link.create(raw.code, digest)

  console.log(`${size},${link},${paddedSize},${pieceSize},${cid}`)
}

/**
 * @param {NodeJS.ReadStream} stream
 */
const readInput = (stream) => {
  process.stdin.resume()

  return new Promise((succeed) => {
    process.stdin.once('data', function (data) {
      succeed(data)
    })
  })
}

main()
