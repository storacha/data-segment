export interface Aggregate {
  dealSize: PaddedPieceSize
  index: IndexData
  tree: MerkleTree
}

export type PaddedPieceSize = New<{ PaddedPieceSize: number }>

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
  /**
   * ConstructProof constructs a Merkle proof of the subtree (or leaf) at level lvl with index idx.
   * level 0 is the root and index 0 is the left-most node in a level.
   */
  constructProof(level?: number, index?: number): Result<ProofData, Error>
  /**
   * ValidateFromLeafs checks that the Merkle tree is correctly constructed based on all the leafData
   */
  validateFromLeafs(leafData: Uint8Array[]): Result<Unit, Error>
  /**
   * Validate checks that the Merkle tree is correctly constructed, based on the internal nodes
   */
  validate(): Result<Unit, Error>
  /**
   * Serialize serializes the MerkleTree into a byte slice
   */
  exportAsBytes(): Result<Uint8Array, Error>
}

export interface ProofData {
  path: Node[]
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
