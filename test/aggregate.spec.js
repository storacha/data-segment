import * as Aggregate from '../src/aggregate.js'
import * as Dataset from './piece/vector.js'
import * as Piece from '../src/piece.js'
import * as Link from 'multiformats/link'

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
      /padded piece size must be a power of 2/
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
      build.link()
    )
  },

  'single piece': async (assert) => {
    const builder = Aggregate.createBuilder({
      size: Piece.PaddedSize.from(1 << 20),
    })

    const piece = {
      root: Link.parse(
        'baga6ea4seaqae5ysjdbsr4b5jhotaz5ooh62jrrdbxwygfpkkfjz44kvywycmgy'
      ).multihash.digest,
      size: Piece.UnpaddedSize.toPaddedSize(Piece.UnpaddedSize.from(520192)),
    }

    builder.write(piece)

    const build = builder.build()

    assert.deepEqual(
      Link.parse(
        'baga6ea4seaqko3i6w4rij37dqerctuv4kbakbcylpe6weeu3tjp26fqyd6txcjy'
      ).toString(),
      build.link().toString()
    )
  },
  'basic with two pieces': async (assert) => {
    const builder = Aggregate.createBuilder({
      size: Aggregate.PaddedSize.from(1 << 20),
    })

    builder.write({
      root: Link.parse(
        'baga6ea4seaqae5ysjdbsr4b5jhotaz5ooh62jrrdbxwygfpkkfjz44kvywycmgy'
      ).multihash.digest,
      size: Piece.UnpaddedSize.toPaddedSize(Piece.UnpaddedSize.from(520192)),
    })

    assert.deepEqual(
      Link.parse(
        'baga6ea4seaqko3i6w4rij37dqerctuv4kbakbcylpe6weeu3tjp26fqyd6txcjy'
      ),
      builder.build().link()
    )

    builder.write({
      root: Link.parse(
        'baga6ea4seaqnrm2n2g4m23t6rs26obxjw2tjtr7tcho24gepj2naqhevytduyoa'
      ).multihash.digest,
      size: Piece.UnpaddedSize.toPaddedSize(Piece.UnpaddedSize.from(260096)),
    })

    const build = builder.build()

    assert.deepEqual(
      Link.parse(
        'baga6ea4seaqnqkeoqevjjjfe46wo2lpfclcbmkyms4wkz5srou3vzmr3w3c72bq'
      ),
      build.link()
    )

    assert.equal(build.size, 1n << 20n)
    assert.deepEqual(build.limit, 8)
    assert.deepEqual(build.indexSize, 512)
    assert.deepEqual(builder.indexSize, 512)

    assert.deepEqual(
      JSON.stringify(build),
      JSON.stringify({
        link: build.link(),
        size: 1 << 20,
      })
    )
  },

  'fails when pieces are too large to fit index': async (assert) => {
    const builder = Aggregate.createBuilder({
      size: Aggregate.PaddedSize.from(1 << 20),
    })

    builder.write({
      size: Piece.PaddedSize.from(131072),
      root: Link.parse(
        `baga6ea4seaqievout3bskdb76gzldeidkhxo6z5zjrnl2jruvwfwvr2uvvpuwdi`
      ).multihash.digest,
    })

    const estimate = builder.estimate({
      size: Piece.PaddedSize.from(524288),
      root: Link.parse(
        `baga6ea4seaqkzsosscjqdegbhqrlequtm7pbjscwpeqwhrd53cxov5td34vfojy`
      ).multihash.digest,
    })

    assert.match(estimate.error, /Pieces are too large to fit/)

    assert.throws(
      () =>
        builder.write({
          size: Piece.PaddedSize.from(524288),
          root: Link.parse(
            `baga6ea4seaqkzsosscjqdegbhqrlequtm7pbjscwpeqwhrd53cxov5td34vfojy`
          ).multihash.digest,
        }),
      /Pieces are too large to fit in the index/
    )
  },

  'pass bad value to estimate': async (assert) => {
    const builder = Aggregate.createBuilder({
      size: Aggregate.PaddedSize.from(1 << 20),
    })

    builder.write({
      size: Piece.PaddedSize.from(131072),
      root: Link.parse(
        `baga6ea4seaqievout3bskdb76gzldeidkhxo6z5zjrnl2jruvwfwvr2uvvpuwdi`
      ).multihash.digest,
    })

    const estimate = builder.estimate({
      size: Piece.PaddedSize.from(524288) + 1n,
      root: Link.parse(
        `baga6ea4seaqkzsosscjqdegbhqrlequtm7pbjscwpeqwhrd53cxov5td34vfojy`
      ).multihash.digest,
    })

    assert.match(estimate.error, /padded piece size must be a power of 2/)
  },

  'basic aggregate builder': async (assert) => {
    const pieces = [...Dataset.pieces]
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
      build.link()
    )
  },

  'fails to write when too many pieces are added': async (assert) => {
    const pieces = [
      {
        root: Link.parse(
          'baga6ea4seaqae5ysjdbsr4b5jhotaz5ooh62jrrdbxwygfpkkfjz44kvywycmgy'
        ).multihash.digest,
        size: Piece.PaddedSize.from(1 << 7),
      },
      {
        root: Link.parse(
          'baga6ea4seaqnrm2n2g4m23t6rs26obxjw2tjtr7tcho24gepj2naqhevytduyoa'
        ).multihash.digest,
        size: Piece.PaddedSize.from(1 << 7),
      },
      {
        root: Link.parse(
          'baga6ea4seaqa2dqkaeaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        ).multihash.digest,
        size: Piece.PaddedSize.from(1 << 7),
      },
      {
        root: Link.parse(
          'baga6ea4seaqa2dqkaeaacaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        ).multihash.digest,
        size: Piece.PaddedSize.from(1 << 7),
      },
      {
        root: Link.parse(
          'baga6ea4seaqa2dqkaeaagaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        ).multihash.digest,
        size: Piece.PaddedSize.from(1 << 7),
      },
    ]

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
    const build = Aggregate.build({
      pieces: [
        {
          root: Link.parse(
            'baga6ea4seaqae5ysjdbsr4b5jhotaz5ooh62jrrdbxwygfpkkfjz44kvywycmgy'
          ).multihash.digest,
          size: Piece.UnpaddedSize.toPaddedSize(
            Piece.UnpaddedSize.from(520192)
          ),
        },
        {
          root: Link.parse(
            'baga6ea4seaqnrm2n2g4m23t6rs26obxjw2tjtr7tcho24gepj2naqhevytduyoa'
          ).multihash.digest,
          size: Piece.UnpaddedSize.toPaddedSize(
            Piece.UnpaddedSize.from(260096)
          ),
        },
      ],
      size: Aggregate.PaddedSize.from(1 << 20),
    })

    assert.deepEqual(
      Link.parse(
        'baga6ea4seaqnqkeoqevjjjfe46wo2lpfclcbmkyms4wkz5srou3vzmr3w3c72bq'
      ),
      build.link()
    )

    assert.equal(build.size, 1n << 20n)
    assert.deepEqual(build.limit, 8)
    assert.deepEqual(build.indexSize, 512)

    assert.deepEqual(
      JSON.stringify(build),
      JSON.stringify({
        link: build.link(),
        size: 1 << 20,
      })
    )
  },
}
