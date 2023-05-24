import * as FS from 'fs'
const content = FS.readFileSync('./test/commp/vector.csv', 'utf8')

const [, ...lines] = content.trim().split('\n')
export default lines.map((line) => {
  const [size, cid, paddedSize, pieceSize, commP] = line.split(',')

  return {
    in: {
      cid: cid.trim(),
      size: Number.parseInt(size.trim()),
    },
    out: {
      paddedSize: Number.parseInt(paddedSize.trim()),
      pieceSize: Number.parseInt(pieceSize.trim()),
      cid: commP.trim(),
    },
  }
})
