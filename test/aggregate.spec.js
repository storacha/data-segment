import * as Aggregate from '../src/aggregate.js'
import * as Dataset from './piece/vector.js'
import * as Piece from '../src/piece.js'
import * as Link from 'multiformats/link'

/**
 * @type {import("entail").Suite}
 */
export const testAggregate = {
  'test empty': async (assert) => {
    const builder = Aggregate.createBuilder(34359738368)
    const build = builder.close()

    assert.deepEqual(
      Link.parse(
        'baga6ea4seaqao7s73y24kcutaosvacpdjgfe5pw76ooefnyqw4ynr3d2y6x2mpq'
      ),
      build.link()
    )
  },

  'single piece': async (assert) => {
    const builder = Aggregate.createBuilder(1 << 20)
    const piece = {
      root: Link.parse(
        'baga6ea4seaqae5ysjdbsr4b5jhotaz5ooh62jrrdbxwygfpkkfjz44kvywycmgy'
      ).multihash.digest,
      size: Piece.toPaddedSize(Piece.UnpaddedPieceSize(520192)),
    }

    builder.write(piece)

    const build = builder.close()

    assert.deepEqual(
      Link.parse(
        'baga6ea4seaqko3i6w4rij37dqerctuv4kbakbcylpe6weeu3tjp26fqyd6txcjy'
      ),
      build.link()
    )
  },
  'basic with two pieces': async (assert) => {
    const builder = Aggregate.createBuilder(1 << 20)
    builder.write({
      root: Link.parse(
        'baga6ea4seaqae5ysjdbsr4b5jhotaz5ooh62jrrdbxwygfpkkfjz44kvywycmgy'
      ).multihash.digest,
      size: Piece.toPaddedSize(Piece.UnpaddedPieceSize(520192)),
    })

    builder.write({
      root: Link.parse(
        'baga6ea4seaqnrm2n2g4m23t6rs26obxjw2tjtr7tcho24gepj2naqhevytduyoa'
      ).multihash.digest,
      size: Piece.toPaddedSize(Piece.UnpaddedPieceSize(260096)),
    })
    const build = builder.close()

    assert.deepEqual(
      Link.parse(
        'baga6ea4seaqnqkeoqevjjjfe46wo2lpfclcbmkyms4wkz5srou3vzmr3w3c72bq'
      ),
      build.link()
    )
  },
  'basic aggregate builder': async (assert) => {
    const pieces = [...Dataset.pieces]
    const capacity = Piece.PaddedPieceSize(34359738368)
    const builder = Aggregate.createBuilder(capacity)

    for (const piece of pieces) {
      builder.write(piece)
    }

    const build = builder.close()

    assert.deepEqual(
      Link.parse(
        'baga6ea4seaqd6rv4mrnqpi7kfqcpazxzhho7pytj3v3woh46dzq2hi3zpztfcjy'
      ),
      build.link()
    )
  },
}
