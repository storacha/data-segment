import * as Aggregate from '../src/aggregate.js'
import * as Dataset from './piece/vector.js'
import * as Piece from '../src/piece.js'
import * as Link from 'multiformats/link'
import * as Node from '../src/node.js'
import * as API from '../src/api.js'

/**
 * @type {import("entail").Suite}
 */
export const testAggregate = {
  'test with non pow2': async (assert) => {
    assert.throws(
      () =>
        Aggregate.createBuilder({
          size: Aggregate.PaddedSize.from(1 << 20) + 1n,
        }),
      /Piece size must be a power of 2/
    )
  },
  'test empty': async (assert) => {
    const builder = Aggregate.createBuilder({
      size: Aggregate.PaddedSize.from(34359738368),
    })
    const build = builder.build()

    assert.deepEqual(
      Link.parse(
        'baga6ea4seaqao7s73y24kcutaosvacpdjgfe5pw76ooefnyqw4ynr3d2y6x2mpq'
      ),
      build.toInfo().link
    )
  },

  'single piece': async (assert) => {
    const builder = Aggregate.createBuilder({
      size: Piece.PaddedSize.from(1 << 20),
    })

    builder.write(
      Piece.fromInfo({
        link: Link.parse(
          'baga6ea4seaqae5ysjdbsr4b5jhotaz5ooh62jrrdbxwygfpkkfjz44kvywycmgy'
        ),
        size: Piece.UnpaddedSize.toPaddedSize(Piece.UnpaddedSize.from(520192)),
      })
    )

    const build = builder.build()

    assert.deepEqual(
      Link.parse(
        'baga6ea4seaqko3i6w4rij37dqerctuv4kbakbcylpe6weeu3tjp26fqyd6txcjy'
      ).toString(),
      build.toInfo().link.toString()
    )
  },
  'basic with two pieces': async (assert) => {
    const builder = Aggregate.createBuilder({
      size: Aggregate.PaddedSize.from(1 << 20),
    })

    builder.write(
      Piece.fromInfo({
        link: Link.parse(
          'baga6ea4seaqae5ysjdbsr4b5jhotaz5ooh62jrrdbxwygfpkkfjz44kvywycmgy'
        ),
        size: Piece.UnpaddedSize.toPaddedSize(Piece.UnpaddedSize.from(520192)),
      })
    )

    assert.deepEqual(
      Link.parse(
        'baga6ea4seaqko3i6w4rij37dqerctuv4kbakbcylpe6weeu3tjp26fqyd6txcjy'
      ),
      builder.build().toInfo().link
    )

    builder.write(
      Piece.fromJSON(
        Piece.fromInfo({
          link: Link.parse(
            'baga6ea4seaqnrm2n2g4m23t6rs26obxjw2tjtr7tcho24gepj2naqhevytduyoa'
          ),
          size: Piece.UnpaddedSize.toPaddedSize(
            Piece.UnpaddedSize.from(260096)
          ),
        }).toJSON()
      )
    )

    const build = builder.build()

    assert.deepEqual(
      Link.parse(
        'baga6ea4seaqnqkeoqevjjjfe46wo2lpfclcbmkyms4wkz5srou3vzmr3w3c72bq'
      ),
      build.toInfo().link
    )

    assert.equal(build.size, 1n << 20n)
    assert.deepEqual(build.limit, 8)
    assert.deepEqual(build.indexSize, 512)
    assert.deepEqual(builder.indexSize, 512)

    assert.deepEqual(
      JSON.stringify(build),
      JSON.stringify(
        Piece.toJSON({
          root: build.root,
          height: Math.log2((1 << 20) / Node.Size),
          padding: 0n,
        })
      )
    )
  },

  'fails when pieces are too large to fit index': async (assert) => {
    const builder = Aggregate.createBuilder({
      size: Aggregate.PaddedSize.from(1 << 20),
    })

    builder.write(
      Piece.fromInfo({
        size: Piece.PaddedSize.from(131072),
        link: Link.parse(
          `baga6ea4seaqievout3bskdb76gzldeidkhxo6z5zjrnl2jruvwfwvr2uvvpuwdi`
        ),
      })
    )

    const estimate = builder.estimate(
      Piece.fromInfo({
        size: Piece.PaddedSize.from(524288),
        link: Link.parse(
          `baga6ea4seaqkzsosscjqdegbhqrlequtm7pbjscwpeqwhrd53cxov5td34vfojy`
        ),
      })
    )

    assert.match(estimate.error, /Pieces are too large to fit/)

    assert.throws(
      () =>
        builder.write(
          Piece.fromInfo({
            size: Piece.PaddedSize.from(524288),
            link: Link.parse(
              `baga6ea4seaqkzsosscjqdegbhqrlequtm7pbjscwpeqwhrd53cxov5td34vfojy`
            ),
          })
        ),
      /Pieces are too large to fit in the index/
    )
  },
  'basic aggregate builder': async (assert) => {
    const pieces = [...Dataset.pieces].map(Piece.fromInfo)
    const builder = Aggregate.createBuilder({
      size: Piece.PaddedSize.from(34359738368),
    })

    for (const piece of pieces) {
      builder.write(piece)
    }

    const build = builder.build()

    assert.deepEqual(
      Link.parse(
        'baga6ea4seaqd6rv4mrnqpi7kfqcpazxzhho7pytj3v3woh46dzq2hi3zpztfcjy'
      ),
      build.toInfo().link
    )
  },

  'fails to write when too many pieces are added': async (assert) => {
    /** @type {API.PieceInfo[]} */
    const source = [
      {
        link: Link.parse(
          'baga6ea4seaqae5ysjdbsr4b5jhotaz5ooh62jrrdbxwygfpkkfjz44kvywycmgy'
        ),
        size: Piece.PaddedSize.from(1 << 7),
      },
      {
        link: Link.parse(
          'baga6ea4seaqnrm2n2g4m23t6rs26obxjw2tjtr7tcho24gepj2naqhevytduyoa'
        ),
        size: Piece.PaddedSize.from(1 << 7),
      },
      {
        link: Link.parse(
          'baga6ea4seaqa2dqkaeaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        ),
        size: Piece.PaddedSize.from(1 << 7),
      },
      {
        link: Link.parse(
          'baga6ea4seaqa2dqkaeaacaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        ),
        size: Piece.PaddedSize.from(1 << 7),
      },
      {
        link: Link.parse(
          'baga6ea4seaqa2dqkaeaagaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        ),
        size: Piece.PaddedSize.from(1 << 7),
      },
    ]
    const pieces = source.map(Piece.fromInfo)

    assert.throws(
      () =>
        Aggregate.build({
          pieces,
          size: Aggregate.PaddedSize.from(1 << 10),
        }),
      /too many pieces for a 1024 sized aggregate: 5 > 4/i
    )
  },

  'build() api': async (assert) => {
    /** @type {API.PieceInfo[]} */
    const source = [
      {
        link: Link.parse(
          'baga6ea4seaqae5ysjdbsr4b5jhotaz5ooh62jrrdbxwygfpkkfjz44kvywycmgy'
        ),
        size: Piece.UnpaddedSize.toPaddedSize(Piece.UnpaddedSize.from(520192)),
      },
      {
        link: Link.parse(
          'baga6ea4seaqnrm2n2g4m23t6rs26obxjw2tjtr7tcho24gepj2naqhevytduyoa'
        ),
        size: Piece.UnpaddedSize.toPaddedSize(Piece.UnpaddedSize.from(260096)),
      },
    ]
    const build = Aggregate.build({
      pieces: source.map(Piece.fromInfo),
      size: Aggregate.PaddedSize.from(1 << 20),
    })

    assert.deepEqual(
      Link.parse(
        'baga6ea4seaqnqkeoqevjjjfe46wo2lpfclcbmkyms4wkz5srou3vzmr3w3c72bq'
      ),
      build.toInfo().link
    )

    assert.equal(build.size, 1n << 20n)
    assert.deepEqual(build.limit, 8)
    assert.deepEqual(build.indexSize, 512)
  },
}
