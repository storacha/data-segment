import {
  Aggregate,
  Node,
  Proof,
  Piece,
  Link,
  Inclusion,
  API,
} from '@web3-storage/data-segment'

/**
 * @type {import("entail").Suite}
 */
export const testInclusionProof = {
  'Proof.tree / Proof.index': (assert) => {
    const tree = Proof.create({
      offset: 0n,
      path: [Node.of(0x2), Node.of(0x3)],
    })

    const index = Proof.create({
      offset: 16769024n,
      path: [Node.of(0x9), Node.of(0x8)],
    })

    const proof = Inclusion.create({ tree, index })

    assert.equal(Inclusion.tree(proof), tree)

    assert.equal(Inclusion.index(proof), index)
  },

  'test resolveAggregate': async (assert) => {
    const a = Piece.fromString(
      'bafkzcibbbybhoesiymupapkj3uygpltr7wsmmiyn5wbrl2srkophcvofwatbw'
    )
    const b = Piece.fromString(
      'bafkzcibbbxmlgtorxdgw47umwxtqn2nwu2m4p4yr3wxbrd2otiebzfoey5gdq'
    )

    const dealSize = Piece.PaddedSize.from(1 << 30)
    const aggregate = Aggregate.build({
      size: dealSize,
      pieces: [a, b],
    })

    const p1 = aggregate.resolveProof(a.link)
    if (p1.error) {
      throw p1.error
    }

    assert.deepEqual(Inclusion.resolveAggregate(p1.ok, a.link), {
      ok: aggregate.link,
    })

    const p2 = aggregate.resolveProof(b.link)
    if (p2.error) {
      throw p2.error
    }

    assert.deepEqual(Inclusion.resolveAggregate(p2.ok, b.link), {
      ok: aggregate.link,
    })

    const e1 = Inclusion.resolveAggregate(
      Inclusion.create({
        tree: Proof.create({
          path: Proof.path(Inclusion.tree(p1.ok)),
          offset: 1000n,
        }),
        index: Inclusion.index(p1.ok),
      }),
      a.link
    )
    assert.match(e1.error?.message, /Inclusion proof is invalid/)

    const e2 = Inclusion.resolveAggregate(
      Inclusion.create({
        tree: Proof.create({
          path: Proof.path(Inclusion.tree(p1.ok)),
          offset: aggregate.size,
        }),
        index: Inclusion.index(p1.ok),
      }),
      a.link
    )
    assert.match(e2.error?.message, /offset greater than width of the tree/)

    const e3 = Inclusion.resolveAggregate(
      Inclusion.create({
        tree: Inclusion.tree(p1.ok),
        index: Proof.create({
          path: Proof.path(Inclusion.index(p1.ok)),
          offset: aggregate.size,
        }),
      }),
      a.link
    )
    assert.match(e3.error?.message, /offset greater than width of the tree/)

    const e4 = Inclusion.resolveAggregate(
      Inclusion.create({
        tree: Inclusion.tree(p1.ok),
        index: Proof.create({
          path: Proof.path(Inclusion.index(p1.ok)),
          offset: 1n,
        }),
      }),
      a.link
    )
    assert.match(e4.error?.message, /Index entry at a wrong offset/)
  },
}
