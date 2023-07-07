import { load } from '../util.js'

const url = new URL('./vector.csv', import.meta.url)

const blob = await load(url)
const content = await blob.text()

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
