// This is a script that does following in JS
// @see https://github.com/filecoin-project/go-data-segment/blob/master/merkletree/zero_comm_test.go

import { compute } from '../src/zero-comm/compute.js'
import { base64 } from 'multiformats/bases/base64'

export const main = () => {
  const lines = [
    `import { base64 } from 'multiformats/bases/base64'`,
    '',
    '// compile time generated version of ./compute.js',
    `export default base64.baseDecode('${base64.baseEncode(compute())}')`,
  ]

  console.log(lines.join('\n'))
}

main()
