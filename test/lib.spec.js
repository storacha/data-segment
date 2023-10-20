import * as Lib from '@web3-storage/data-segment'
import * as Link from 'multiformats/link'

/**
 * @type {import('entail').Suite}
 */
export const testLib = {
  'test aggregate sample': async (assert) => {
    /** @type {Lib.PieceInfo[]} */
    const source = [
      {
        link: Link.parse(
          'baga6ea4seaqae5ysjdbsr4b5jhotaz5ooh62jrrdbxwygfpkkfjz44kvywycmgy'
        ),
        size: Lib.Piece.Size.fromPadded(520192n),
      },
      {
        link: Link.parse(
          `baga6ea4seaqnrm2n2g4m23t6rs26obxjw2tjtr7tcho24gepj2naqhevytduyoa`
        ),
        size: Lib.Piece.Size.fromPadded(260096n),
      },
    ]

    const pieces = source.map(Lib.Piece.fromInfo)

    const dealSize = Lib.Piece.Size.from(1 << 20)
    const aggregate = Lib.Aggregate.createBuilder({
      size: dealSize,
    })
    for (const piece of pieces) {
      aggregate.write(piece)
    }
  },
}
