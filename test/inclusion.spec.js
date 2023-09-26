import { Node, Proof, Inclusion, API } from '@web3-storage/data-segment'

/**
 * @type {import("entail").Suite}
 */
export const testInclusionProof = {
  'Proof.tree / Proof.index': (assert) => {
    const tree = Proof.create({
      at: 0n,
      path: [Node.of(0x2), Node.of(0x3)],
    })

    const index = Proof.create({
      at: 16769024n,
      path: [Node.of(0x9), Node.of(0x8)],
    })

    const proof = Inclusion.create({ tree, index })

    assert.equal(Inclusion.tree(proof), tree)

    assert.equal(Inclusion.index(proof), index)
  },
}
