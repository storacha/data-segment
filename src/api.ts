/**
 * Implementers of the `Read` interface are called "readers". Readers
 * allow for reading bytes from an underlying source.
 *
 * Readers are defined by one required method, `read`. Each call to `read`
 * will attempt to pull bytes from this source into a provided buffer. A
 * number of high level functions are implemented in terms of `read`, giving
 * users a number of ways to read bytes while only needing to implement a
 * single method.
 *
 * This based on [std::io::Read] trait in Rust.
 * [std::io::Read]:https://doc.rust-lang.org/nightly/std/io/trait.Read.html
 */
export interface Read {
  /**
   * Pull some bytes from this source into the specified buffer, returning how
   * many bytes were read.
   *
   * If the return value of this method is `{ok: n}`, then implementations MUST
   * guarantee that `0 <= n <= buffer.length`. A nonzero `n` value indicates
   * that the buffer has been filled in with `n` bytes of data from this source.
   * If `n` is `0`, then it can indicate one of two scenarios:
   *
   * 1. This reader has reached its “end of file” and will likely no longer be
   *    able to produce bytes. Note that this does not mean that the reader
   *    will always no longer be able to produce bytes. For example, underlying
   *    source may be a stream that simply does not currently have more data,
   *    but once more data is added read may succeed.
   *
   * 2. The buffer specified was 0 bytes in length.
   *
   * It is not an error if the returned value `n` is smaller than the `buffer`
   * size, even when the reader is not at the end of the stream yet. This may
   * happen for example because fewer bytes are actually available right now.
   */
  read(buffer: Uint8Array): Poll<number, Error>
}

type Poll<T, X> = Variant<{
  ok: T
  error: X
  wait: Promise<void>
}>

export interface Aggregate {
  dealSize: PaddedPieceSize
  index: IndexData
  tree: MerkleTree
}

export type PaddedPieceSize = New<{ PaddedPieceSize: number }>

export type Fr32 = New<{ Fr32: Uint8Array }, { size: 32 }>

export interface IndexData {
  entries: SegmentDescriptor[]
}

export interface SegmentDescriptor {
  commDs: MerkleTreeNode
  offset: number
  size: number
  checksum: Uint8Array
}

export interface MerkleTree {
  depth: number
  leafCount: number
  root: MerkleTreeNode
  leafs: MerkleTreeNode[]

  node(level: number, index: number): MerkleTreeNode | undefined
  // /**
  //  * ConstructProof constructs a Merkle proof of the subtree (or leaf) at level lvl with index idx.
  //  * level 0 is the root and index 0 is the left-most node in a level.
  //  */
  // constructProof(level?: number, index?: number): Result<ProofData, Error>
  // /**
  //  * ValidateFromLeafs checks that the Merkle tree is correctly constructed based on all the leafData
  //  */
  // validateFromLeafs(leafData: Uint8Array[]): Result<Unit, Error>
  // /**
  //  * Validate checks that the Merkle tree is correctly constructed, based on the internal nodes
  //  */
  // validate(): Result<Unit, Error>
  // /**
  //  * Serialize serializes the MerkleTree into a byte slice
  //  */
  // exportAsBytes(): Result<Uint8Array, Error>
}

export interface TreeData {
  /**
   * nodes start from root and go down left-to-right
   * thus `nodes[0].length === 1, nodes[1].length === 2len(nodes[1]) = 2`, etc...
   */
  nodes: MerkleTreeNode[][]
  /**
   * Leafs is the amount of raw leafs being used. I.e. without padding to
   * nearest two-power
   */
  leafs: number
}

export interface ProofData {
  path: MerkleTreeNode[]
  // index indicates the index within the level where the element whose membership to prove is located
  // Leftmost node is index 0
  index: number
}

export type MerkleTreeNode = New<{ Node: Uint8Array }, { size: 32 }>

export type Tagged<T> = {
  [Case in keyof T]: Exclude<keyof T, Case> extends never
    ? T
    : InferenceError<'It may only contain one key'>
}[keyof T]

declare const Marker: unique symbol

/**
 * A utility type to retain an unused type parameter `T`.
 * Similar to [phantom type parameters in Rust](https://doc.rust-lang.org/rust-by-example/generics/phantom.html).
 *
 * Capturing unused type parameters allows us to define "nominal types," which
 * TypeScript does not natively support. Nominal types in turn allow us to capture
 * semantics not represented in the actual type structure, without requiring us to define
 * new classes or pay additional runtime costs.
 *
 * For a concrete example, see {@link ByteView}, which extends the `Uint8Array` type to capture
 * type information about the structure of the data encoded into the array.
 */
export interface Phantom<T> {
  // This field can not be represented because field name is non-existent
  // unique symbol. But given that field is optional any object will valid
  // type constraint.
  [Marker]?: T
}

export type New<T, Type = Tagged<T>> = Tagged<T>[keyof Tagged<T>] &
  Phantom<Type>

/**
 * Utility type for including type errors in the typescript checking. It
 * defines impossible type (object with non-existent unique symbol field).
 * This type can be used in cases where typically `never` is used, but
 * where some error message would be useful.
 */
interface InferenceError<message> {
  [Marker]: never & message
}

/**
 * Defines result type as per invocation spec
 *
 * @see https://github.com/ucan-wg/invocation/#6-result
 */

export type Result<T extends {} = {}, X extends {} = {}> = Variant<{
  ok: T
  error: X
}>

/**
 * @see {@link https://en.wikipedia.org/wiki/Unit_type|Unit type - Wikipedia}
 */
export interface Unit {}
/**
 * Utility type for defining a [keyed union] type as in IPLD Schema. In practice
 * this just works around typescript limitation that requires discriminant field
 * on all variants.
 *
 * ```ts
 * type Result<T, X> =
 *   | { ok: T }
 *   | { error: X }
 *
 * const demo = (result: Result<string, Error>) => {
 *   if (result.ok) {
 *   //  ^^^^^^^^^ Property 'ok' does not exist on type '{ error: Error; }`
 *   }
 * }
 * ```
 *
 * Using `Variant` type we can define same union type that works as expected:
 *
 * ```ts
 * type Result<T, X> = Variant<{
 *   ok: T
 *   error: X
 * }>
 *
 * const demo = (result: Result<string, Error>) => {
 *   if (result.ok) {
 *     result.ok.toUpperCase()
 *   }
 * }
 * ```
 *
 * [keyed union]:https://ipld.io/docs/schemas/features/representation-strategies/#union-keyed-representation
 */
export type Variant<U extends Record<string, unknown>> = {
  [Key in keyof U]: { [K in Exclude<keyof U, Key>]?: never } & {
    [K in Key]: U[Key]
  }
}[keyof U]
