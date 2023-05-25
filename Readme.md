# @web3-storage/data-segment

Implementation of the [FRC-0058] verifiable aggregation scheme.

## API

```ts
import { CommP } from "@web3-storage/data-segment"

const demo = async (bytes: Uint8Array) => {
  const commP = await CommP.build(bytes)
  // Gives you a commP as a CID
  const cid = commP.link()
}
```

## Prior Art

Implementation originally started as fork of [js-fill-utils] modernizing it to use ES modules and web crypto APIs in place of node APIs.

Hover it produces different results from more widely used go implementation which is why it got some heavy lifting inspired by [go-data-segment] and [go-fil-commp-hashhash] libraries.

[go-data-segment]:https://github.com/filecoin-project/go-fil-commp-hashhash/tree/master
[go-fil-commp-hashhash]:https://github.com/filecoin-project/go-data-segment/tree/master
[js-fil-utils]: https://github.com/rvagg/js-fil-utils/tree/master
[FRC-0058]: https://github.com/filecoin-project/FIPs/blob/master/FRCs/frc-0058.md
