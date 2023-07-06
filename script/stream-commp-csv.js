import process from 'node:process'
import * as FS from 'node:fs'
import { deriveBuffer } from '../test/util.js'
import SHA256 from 'sync-multihash-sha2/sha256'
import * as raw from 'multiformats/codecs/raw'
import * as Link from 'multiformats/link'

const main = async () => {
  const content = await readInput(process.stdin)

  const [, commp, payload, padded, piece] = content.toString().split('\n')

  const cid = commp.split(/\s+/)[1].trim()
  const contentSize = parseInt(payload.split(/\s+/)[1].trim())
  const paddedSize = parseInt(padded.split(/\s+/)[2].trim())
  const size = parseInt(piece.split(/\s+/)[2].trim())

  const source = deriveBuffer(contentSize)
  const digest = SHA256.digest(source)
  const link = Link.create(raw.code, digest)

  console.log(`${contentSize},${link},${paddedSize},${size},${cid}`)
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
