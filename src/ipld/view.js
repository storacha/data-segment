import * as API from '../api.js'
import * as Link from 'multiformats/link'
import * as SHA256 from './sha256.js'
import * as CBOR from './cbor.js'

export { SHA256, CBOR }

/**
 * Defines plain layout to be used in views that encode data as is
 * without layout conversion.
 */
export const Plain = {
  /**
   * @template T
   * @param {T} data
   * @returns {T}
   */
  into(data) {
    return data
  },
  /**
   * @template T
   * @param {T} data
   * @returns {T}
   */
  from(data) {
    return data
  },
}

/**
 * @template Layout
 * @template {API.MulticodecCode} Format
 * @template {API.MulticodecCode} Hash
 * @param {API.ByteView<Layout, Format>} bytes
 * @param {object} settings
 * @param {API.SyncMultihashHasher<Hash>} settings.hasher
 * @param {object} settings.codec
 * @param {Format} settings.codec.code
 * @returns {API.Link<Layout, Format, Hash>}
 */
export const createLink = (bytes, { hasher, codec }) => {
  const digest = hasher.digest(bytes)
  return Link.create(codec.code, digest)
}

/**
 * A view is a wrapper either around block data (model), or it's serialized
 * bytes. It performs on-demand encode / decode of the data in order to provide
 * access to the data model, bytes and link to this block.
 *
 * It also supports use cases where data model and data layout (in encoded) form
 * are different, for example filecoin go libraries like to serialize structs
 * like `{ path: string[], index: int }` into layout like `[int, string[]]`.
 * We support this through bidirectional `layout` conversion functions that is
 * utilized during encode / decode of the data.
 *
 * @template [Model={}|null]
 * @template {{}|null} [Layout=Model&{}]
 * @template {API.MulticodecCode} [Format=CBOR.code]
 * @template {API.MulticodecCode} [Hash=SHA256.code]
 * @implements {API.IPLDBlockView<Model, Layout, Format, Hash>}
 */
export class View {
  /**
   * @param {API.ViewSource<Model, Layout, Format, Hash>} source
   */
  constructor(source) {
    this.source = source
  }

  /**
   * Logical representation of the underlying data.
   * @type {Model}
   */
  get model() {
    const model = this._model
    // If we already have cached model, return it.
    if (model) {
      return model
    }
    // If this is a view over the data model we cache it and return it.
    else if (this.source.bytes == null) {
      const model = this.source.model
      this._model = model
      return model
    }
    // if this is a view over the bytes we decode them and then derive the
    // data model which we cache and return.
    else {
      const model = this.source.layout.from(this.layout)
      this._model = model
      return model
    }
  }

  /**
   * Data layout used to encode / decode the underlying data.
   *
   * @type {Layout}
   */
  get layout() {
    // If we already have computed layout, return it.
    const layout = this._layout
    if (layout) {
      return layout
    }
    // If this is a view over the model we derive data layout and cache it.
    else if (this.source.bytes == null) {
      const layout = this.source.layout.into(this.model)
      this._layout = layout
      return layout
    }
    // If this is a view over the bytes we decode them to get the data layout.
    else {
      const layout = this.source.codec.decode(this.source.bytes)
      this._layout = layout
      return layout
    }
  }

  /**
   * Byte encoded representation of the underlying data.
   *
   * @type {API.ByteView<Layout, Format>}
   */
  get bytes() {
    const bytes = this._bytes
    // If we have cached bytes, return them.
    if (bytes) {
      return bytes
    }
    // if this is a view over the model we encode layout (which may be
    // computed on demand) into bytes and cache it.
    else if (this.source.bytes == null) {
      const bytes = this.source.codec.encode(this.layout)
      this._bytes = bytes
      return bytes
    }
    // If this is a view over the bytes we cache and return.
    else {
      const bytes = this.source.bytes
      this._bytes = bytes
      return bytes
    }
  }
  /**
   * IPLD link for this block.
   *
   * @returns {API.Link<Layout, Format, Hash>}
   */
  get link() {
    // If we have cached link, return it.
    const link = this._link
    if (link) {
      return link
    }
    // otherwise derive it from the bytes and cache it.
    else {
      const link = createLink(this.bytes, this.source)
      this._link = link
      return link
    }
  }
}

export default View
