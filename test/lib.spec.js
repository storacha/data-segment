import { assert } from 'chai'
import { test as proofTests } from './proof.js'

const suits = {
  proofTests,
}

for (const [name, suite] of Object.entries(suits)) {
  describe(name, () => {
    for (const [testName, test] of Object.entries(suite)) {
      it(testName, async () => {
        await test(assert)
      })
    }
  })
}
