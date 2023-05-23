import { assert } from 'chai'

/**
 *
 * @param {import("./api.js").TestSuite} tests
 */
export const test = (tests) => {
  for (const [name, member] of Object.entries(tests)) {
    const define =
      typeof member === 'function'
        ? it
        : typeof member === 'object' && member !== null
        ? describe
        : null

    const modifier = name.startsWith('only!')
      ? define?.only
      : name.startsWith('skip!')
      ? define?.skip
      : define

    if (modifier) {
      modifier(name, () => {
        if (typeof member === 'function') {
          return member(assert)
        } else {
          test(member)
        }
      })
    }
  }
}
