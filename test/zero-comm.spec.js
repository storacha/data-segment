import * as ZeroComm from '../src/zero-comm.js'

/**
 * @type {import('entail').Suite}
 */
export const testZeroComm = {
  'ZeroComm.fromLevel(0)': async (assert) => {
    assert.deepEqual(ZeroComm.fromLevel(0), new Uint8Array(32).fill(0))
  },
  'level must be >=0': async (assert) => {
    assert.throws(
      () => ZeroComm.fromLevel(-1),
      /Only levels between 0 and 63 inclusive are available/
    )
  },
  'level must be <= 64': async (assert) => {
    assert.throws(
      () => ZeroComm.fromLevel(64),
      /Only levels between 0 and 63 inclusive are available/
    )
  },
  'ZeroComm.fromLevel(15)': async (assert) => {
    assert.deepEqual(
      ZeroComm.fromLevel(15),
      new Uint8Array([
        217, 152, 135, 185, 115, 87, 58, 150, 225, 19, 147, 100, 82, 54, 193,
        123, 31, 76, 112, 52, 215, 35, 199, 169, 159, 112, 155, 180, 218, 97,
        22, 43,
      ])
    )
  },
  'ZeroComm.fromLevel(63)': async (assert) => {
    assert.deepEqual(
      ZeroComm.fromLevel(63),
      new Uint8Array([
        187, 148, 98, 169, 238, 22, 200, 173, 52, 49, 93, 189, 207, 49, 75, 243,
        186, 212, 164, 65, 237, 16, 19, 210, 111, 175, 249, 192, 160, 242, 63,
        25,
      ])
    )
  },
}
