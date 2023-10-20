import * as Aggregate from '../src/aggregate.js'
import * as Piece from '../src/piece.js'
import * as Proof from '../src/proof.js'
import {
  DataAggregationProof,
  Inclusion,
  API,
} from '@web3-storage/data-segment'

/**
 * @type {import("entail").Suite}
 */
export const testDataAggregationProof = {
  'test creation / encode / decode': async (assert) => {
    const {
      proofs: [inclusion],
    } = setup()

    const proof = DataAggregationProof.create({
      inclusion,
      dealID: 17n,
    })

    assert.equal(DataAggregationProof.dealID(proof), 17n)
    assert.equal(DataAggregationProof.inclusion(proof), inclusion)
    assert.deepEqual(
      proof,
      DataAggregationProof.decode(DataAggregationProof.encode(proof))
    )

    assert.deepEqual(
      DataAggregationProof.link(proof).toString(),
      'bafyreigm5clptud3fxvoe5shelx6oten7qqnquikgrssjds6fwetq77vlq'
    )
  },
  verify: async (assert) => {
    const { aggregate, pieces, proofs } = setup()
    const [inclusion] = proofs
    const dealID = 2023n
    const proof = DataAggregationProof.create({
      inclusion,
      dealID,
    })

    const result = DataAggregationProof.verify(proof, {
      dealID: dealID,
      piece: pieces[0].link,
      aggregate: aggregate.link,
    })

    assert.deepEqual(result, { ok: {} })

    const badDeal = DataAggregationProof.verify(proof, {
      dealID: dealID + 1n,
      piece: pieces[0].link,
      aggregate: aggregate.link,
    })
    assert.match(badDeal.error, /Proof is for deal 2023 not 2024/)

    const badAggregate = DataAggregationProof.verify(proof, {
      dealID,
      piece: pieces[0].link,
      aggregate: pieces[1].link,
    })
    assert.match(
      badAggregate.error,
      /Computed aggregate .* does not match claimed .*/
    )

    const invalidProof = DataAggregationProof.create({
      inclusion: Inclusion.create({
        tree: Proof.create({
          path: Proof.path(Inclusion.tree(inclusion)),
          // mess with the offset to fail resolution
          offset: aggregate.size,
        }),
        index: Inclusion.index(inclusion),
      }),
      dealID,
    })

    const badProof = DataAggregationProof.verify(invalidProof, {
      dealID: dealID,
      piece: pieces[0].link,
      aggregate: aggregate.link,
    })
    assert.match(badProof.error, /offset greater than width of the tree/)
  },
}

export const setup = () => {
  const pieces = [
    Piece.fromString(
      'bafkzcibcaahae5ysjdbsr4b5jhotaz5ooh62jrrdbxwygfpkkfjz44kvywycmgy'
    ),
    Piece.fromString(
      'bafkzcibcaag5rm2n2g4m23t6rs26obxjw2tjtr7tcho24gepj2naqhevytduyoa'
    ),
  ]

  const aggregate = Aggregate.build({
    size: Piece.Size.from(1 << 30),
    pieces,
  })

  const proofs = pieces.map((piece) =>
    unwrap(aggregate.resolveProof(piece.link))
  )

  return { aggregate, pieces, proofs }
}

/**
 * @template {{}} T
 * @param {API.Result<T, {}>} result
 * @returns {T}
 */
const unwrap = (result) => {
  if (result.ok) {
    return result.ok
  } else {
    throw result.error
  }
}
