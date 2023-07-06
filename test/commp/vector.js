import * as FS from 'fs'
const content = FS.readFileSync('./test/commp/vector.csv', 'utf8')

const [, ...lines] = content.trim().split('\n')
export default lines.map((line) => {
  const [contentSize, cid, paddedSize, size, commP] = line.split(',')

  return {
    in: {
      cid: cid.trim(),
      contentSize: Number.parseInt(contentSize.trim()),
    },
    out: {
      paddedSize: Number.parseInt(paddedSize.trim()),
      size: Number.parseInt(size.trim()),
      cid: commP.trim(),
    },
  }
})
