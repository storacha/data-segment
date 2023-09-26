import { View, createLink, CBOR, SHA256, Plain } from '../src/ipld.js'

/**
 * @type {import("entail").Suite}
 */
export const testIPLDView = {
  'test View': async (assert) => {
    /**
     * @extends {View<{ hello: string }>}
     */
    class Hello extends View {
      get hello() {
        return this.model.hello
      }
    }

    const hello = new Hello({
      model: { hello: 'world' },
      codec: CBOR,
      layout: Plain,
      hasher: SHA256,
    })

    assert.equal(hello.hello, 'world')

    const hello2 = new Hello({
      bytes: hello.bytes,
      codec: CBOR,
      layout: Plain,
      hasher: SHA256,
    })

    assert.deepEqual(hello.model, hello2.model)
    assert.deepEqual(hello.layout, hello2.layout)
    assert.deepEqual(hello.bytes, hello2.bytes)
    assert.deepEqual(hello.link, hello2.link)
    assert.deepEqual(
      hello.link.toString(),
      'bafyreidykglsfhoixmivffc5uwhcgshx4j465xwqntbmu43nb2dzqwfvae'
    )
  },
}
