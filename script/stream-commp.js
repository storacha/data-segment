import process from 'node:process'
import * as Multihash from '../src/multihash.js'
import * as Piece from '../src/piece.js'
import * as Fr32 from '../src/fr32.js'

const main = async () => {
  try {
    const hasher = Multihash.create()
    let contentSize = 0
    for await (const chunk of process.stdin) {
      contentSize += chunk.length
      hasher.write(chunk)
    }
    const digest = hasher.digest()
    const piece = Piece.fromDigest(digest)
    const { link, size } = piece.toInfo()

    console.log(`
CommPCid: ${link}
Payload:                ${contentSize} bytes
Unpadded piece:         ${Fr32.toZeroPaddedSize(contentSize)} bytes
Padded piece:           ${size} bytes`)
  } catch (err) {
    console.error(err)
  }
}

main()
