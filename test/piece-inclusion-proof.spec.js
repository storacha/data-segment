import * as Aggregate from '../src/aggregate.js'
import * as Piece from '../src/piece.js'
import * as Proof from '../src/proof.js'
import * as Link from 'multiformats/link'
import { base64 } from 'multiformats/bases/base64'

/**
 * @type {import("entail").Suite}
 */
export const testPieceInclusionProofs = {
  // @see https://github.com/filecoin-project/go-data-segment/blob/e3257b64fa2c84e0df95df35de409cfed7a38438/datasegment/creation_test.go#L136-L153
  'test piece inclusion proof': async (assert) => {
    const pieces = [
      Piece.fromInfo({
        link: Link.parse(
          'baga6ea4seaqae5ysjdbsr4b5jhotaz5ooh62jrrdbxwygfpkkfjz44kvywycmgy'
        ),
        size: Piece.Size.fromUnpadded(520192n),
      }),
      Piece.fromInfo({
        link: Link.parse(
          'baga6ea4seaqnrm2n2g4m23t6rs26obxjw2tjtr7tcho24gepj2naqhevytduyoa'
        ),
        size: Piece.Size.fromUnpadded(260096n),
      }),
    ]

    const dealSize = Piece.Size.from(1 << 30)
    const aggregate = Aggregate.build({
      size: dealSize,
      pieces,
    })

    const p1 = aggregate.resolveProof(pieces[0].link)
    assert.deepEqual(
      p1.ok ? Aggregate.InclusionProof.link(p1.ok).toString() : null,
      'bafyreiac3cesz5k5ls44b3p67cift7g3ezye2xyulvxfvto5egj7kx5btu'
    )

    assert.deepEqual(
      p1.ok,
      Aggregate.InclusionProof.create({
        tree: Proof.create({
          offset: 0n,
          path: [
            'TUbpoUFC2Yp4+hKwP1Le79SgVOc4AcdFWKqbHc+hqwY=',
            '2ZiHuXNXOpbhE5NkUjbBex9McDTXI8epn3CbtNphFis=',
            '0LUw27C08lxdLyoo3+6Ai1NBKgKTHxjEmfWiVAhrEyY=',
            'hMBCG6BoWgG/eVojRAZP5CS9UqnSQ3ezlP9MS0Vo6BE=',
            'ZfKeXZjSRsOLOIz8BtsfawITA8WiiQAL3OgyqcPsQhw=',
            'oiR1CChYUJZbfjNLMSewwEKx0EbcVEAhN2J82Hmc4To=',
            '2v2rbak2RFPCbTNya5/v40O+j4FknsAJqtP6/1BhdQg=',
            '2UHV4NYxSplcM/+9T75pEY1z1OX9LNMfD3yG690U5wY=',
            'UUxDXD0E00mlNl+9Wf/HE2KREXhZkcGjxTryIHl0Gi8=',
            'rQaFOWnTfTT/COCfVpMKStGaid72DL/ufh0zgcHnHDc=',
            'ZIujewxeatVkU+o5F0h/iXVImNLG1FStWfqR5gdGLQk=',
          ].map(base64.baseDecode),
        }),
        index: Proof.create({
          offset: 16769024n,
          path: [
            'F4SHeChZXPRE3SiszqxuXivpyJYroEN6deOpxYgDeAA=',
            'NzG7maxon2bu9Zc+SpTaGI9N3K5YByT8bz/WDf1IgzM=',
            'ZCpgfviGsAS/LBl4Rjrh1Gk6wPQQ6y0bekf+IF5edQ8=',
            'V6I4GihlK/R/a+96ymeb5K7eWHGrXPPrLAgRRIjLhSY=',
            'H3rJWVUQ4J6kHEYLF2QwuzIs1vtBLsV8sX2YmkMQNy8=',
            '/H6SgpblFvqt6Yayj5LUSk8kuTVIUiM3anmQJ7wY+DM=',
            'CMR7OO4TvEP0G5FcDu2ZEaJghrPtYkAb+dWLjRnf9iQ=',
            'suR7+xH6zZQfYq9cdQ8+pcxN9RfVxPFtsrTXe67Boy8=',
            '+SJhYMj5J7/cxBjN8gNJMUYAjq77fQIZTV5UgYkAUQg=',
            'LBqWS7kLWev+D22imtZa4+QXckqPfBF0WkDKweXnQBE=',
            '/uN4zvFkBLGZ7eCxPhG2JP+deE+77YeNgyl+eV4CTwI=',
            'jp4kA/qITPYjf2DfJfg+5A3Knth5629jUtFQhPWtDT8=',
            'dS2Wk/oWdSQ5VHbjF6mFgPAJR6+3owVA1iWpKRzBKgc=',
            'cCL2D372rfoXEXpSYZ4wzqgsaAda3xxmd4bsUG7vLRk=',
            '2ZiHuXNXOpbhE5NkUjbBex9McDTXI8epn3CbtNphFis=',
            '0LUw27C08lxdLyoo3+6Ai1NBKgKTHxjEmfWiVAhrEyY=',
            'hMBCG6BoWgG/eVojRAZP5CS9UqnSQ3ezlP9MS0Vo6BE=',
            'ZfKeXZjSRsOLOIz8BtsfawITA8WiiQAL3OgyqcPsQhw=',
            'oiR1CChYUJZbfjNLMSewwEKx0EbcVEAhN2J82Hmc4To=',
            '2v2rbak2RFPCbTNya5/v40O+j4FknsAJqtP6/1BhdQg=',
            '2UHV4NYxSplcM/+9T75pEY1z1OX9LNMfD3yG690U5wY=',
            'UUxDXD0E00mlNl+9Wf/HE2KREXhZkcGjxTryIHl0Gi8=',
            'rQaFOWnTfTT/COCfVpMKStGaid72DL/ufh0zgcHnHDc=',
            'Y5h1L7lsVVg0H4zP46n2cKxGLNNbzs5RfUUZ8tYGAAY=',
          ].map(base64.baseDecode),
        }),
      })
    )

    const p2 = aggregate.resolveProof(pieces[1].link)

    assert.deepEqual(
      p2.ok ? Aggregate.InclusionProof.link(p2.ok).toString() : null,
      'bafyreiduwkdmj7gfrfih2j2kt7cab3ppzeqoypksoq3dacy5zzo5s23dgm'
    )

    assert.deepEqual(
      p2.ok,
      Aggregate.InclusionProof.create({
        tree: Proof.create({
          offset: 2n,
          path: [
            'dS2Wk/oWdSQ5VHbjF6mFgPAJR6+3owVA1iWpKRzBKgc=',
            'AncSSMMo8D1J3TBnrnH9pMYjDe2DFepRU55xVcWwJhs=',
            '2ZiHuXNXOpbhE5NkUjbBex9McDTXI8epn3CbtNphFis=',
            '0LUw27C08lxdLyoo3+6Ai1NBKgKTHxjEmfWiVAhrEyY=',
            'hMBCG6BoWgG/eVojRAZP5CS9UqnSQ3ezlP9MS0Vo6BE=',
            'ZfKeXZjSRsOLOIz8BtsfawITA8WiiQAL3OgyqcPsQhw=',
            'oiR1CChYUJZbfjNLMSewwEKx0EbcVEAhN2J82Hmc4To=',
            '2v2rbak2RFPCbTNya5/v40O+j4FknsAJqtP6/1BhdQg=',
            '2UHV4NYxSplcM/+9T75pEY1z1OX9LNMfD3yG690U5wY=',
            'UUxDXD0E00mlNl+9Wf/HE2KREXhZkcGjxTryIHl0Gi8=',
            'rQaFOWnTfTT/COCfVpMKStGaid72DL/ufh0zgcHnHDc=',
            'ZIujewxeatVkU+o5F0h/iXVImNLG1FStWfqR5gdGLQk=',
          ].map(base64.baseDecode),
        }),
        index: Proof.create({
          offset: 16769025n,
          path: [
            'gzH6jfyw/hohDjIBbWDkxfCjqXETF2JkBtYlrJhjrxU=',
            'NzG7maxon2bu9Zc+SpTaGI9N3K5YByT8bz/WDf1IgzM=',
            'ZCpgfviGsAS/LBl4Rjrh1Gk6wPQQ6y0bekf+IF5edQ8=',
            'V6I4GihlK/R/a+96ymeb5K7eWHGrXPPrLAgRRIjLhSY=',
            'H3rJWVUQ4J6kHEYLF2QwuzIs1vtBLsV8sX2YmkMQNy8=',
            '/H6SgpblFvqt6Yayj5LUSk8kuTVIUiM3anmQJ7wY+DM=',
            'CMR7OO4TvEP0G5FcDu2ZEaJghrPtYkAb+dWLjRnf9iQ=',
            'suR7+xH6zZQfYq9cdQ8+pcxN9RfVxPFtsrTXe67Boy8=',
            '+SJhYMj5J7/cxBjN8gNJMUYAjq77fQIZTV5UgYkAUQg=',
            'LBqWS7kLWev+D22imtZa4+QXckqPfBF0WkDKweXnQBE=',
            '/uN4zvFkBLGZ7eCxPhG2JP+deE+77YeNgyl+eV4CTwI=',
            'jp4kA/qITPYjf2DfJfg+5A3Knth5629jUtFQhPWtDT8=',
            'dS2Wk/oWdSQ5VHbjF6mFgPAJR6+3owVA1iWpKRzBKgc=',
            'cCL2D372rfoXEXpSYZ4wzqgsaAda3xxmd4bsUG7vLRk=',
            '2ZiHuXNXOpbhE5NkUjbBex9McDTXI8epn3CbtNphFis=',
            '0LUw27C08lxdLyoo3+6Ai1NBKgKTHxjEmfWiVAhrEyY=',
            'hMBCG6BoWgG/eVojRAZP5CS9UqnSQ3ezlP9MS0Vo6BE=',
            'ZfKeXZjSRsOLOIz8BtsfawITA8WiiQAL3OgyqcPsQhw=',
            'oiR1CChYUJZbfjNLMSewwEKx0EbcVEAhN2J82Hmc4To=',
            '2v2rbak2RFPCbTNya5/v40O+j4FknsAJqtP6/1BhdQg=',
            '2UHV4NYxSplcM/+9T75pEY1z1OX9LNMfD3yG690U5wY=',
            'UUxDXD0E00mlNl+9Wf/HE2KREXhZkcGjxTryIHl0Gi8=',
            'rQaFOWnTfTT/COCfVpMKStGaid72DL/ufh0zgcHnHDc=',
            'Y5h1L7lsVVg0H4zP46n2cKxGLNNbzs5RfUUZ8tYGAAY=',
          ].map(base64.baseDecode),
        }),
      })
    )

    const missingPiece = `bafkzcibbbygq4cqbaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`
    const p3 = aggregate.resolveProof(Link.parse(missingPiece))
    assert.ok(
      p3.error?.message,
      `Piece ${missingPiece} was not found in aggregate ${aggregate.link}`
    )
  },

  'encode <-> decode': (assert) => {
    const pieces = [
      Piece.fromInfo({
        link: Link.parse(
          'baga6ea4seaqae5ysjdbsr4b5jhotaz5ooh62jrrdbxwygfpkkfjz44kvywycmgy'
        ),
        size: Piece.Size.fromUnpadded(520192n),
      }),
      Piece.fromInfo({
        link: Link.parse(
          'baga6ea4seaqnrm2n2g4m23t6rs26obxjw2tjtr7tcho24gepj2naqhevytduyoa'
        ),
        size: Piece.Size.fromUnpadded(260096n),
      }),
    ]

    const dealSize = Piece.Size.from(1 << 30)
    const aggregate = Aggregate.build({
      size: dealSize,
      pieces,
    })

    const proof = aggregate.resolveProof(pieces[0].link).ok

    if (!proof) {
      throw new Error('expected proof to be ok')
    }

    assert.deepEqual(
      proof,
      Aggregate.InclusionProof.decode(Aggregate.InclusionProof.encode(proof))
    )
  },
}
