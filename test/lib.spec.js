import { test } from './test.js'
import { test as proof } from './proof.js'
import { test as commp } from './commp.js'
import { test as tree } from './tree.js'
import { test as fr32 } from './fr32.js'
import { testHybridTree } from './hybrid.js'
import { testAggregate } from './aggregate.js'

test({
  proof,
  tree,
  fr32,
  commp,
  testHybridTree,
  testAggregate,
})
