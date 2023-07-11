import * as Segment from '../src/segment.js'
import * as Node from '../src/node.js'

/** @type {import("entail").Suite} */
export const testSegment = {
  'fail when not aligned': (assert) => {
    const result = Segment.validate({
      root: Node.empty(),
      offset: 123n,
      size: 12222n,
    })

    assert.match(result.error, /offset is not aligned in padded data/)
  },
  'pass when aligned': (assert) => {
    const result = Segment.validate({
      root: Node.empty(),
      offset: 128n,
      size: 128n * 3249n,
    })

    assert.ok(result.ok)
  },
}
