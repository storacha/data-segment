import { MerkleTreeNode as Node } from './api.js'
export type { Node }
export interface ProofData {
  path: Node[]
  index: number
}

export interface MerkleTree {
  Leafs(): Node[]
  Root(): Node
}

export interface BatchedProofData {
  LeftProof(): Result<ProofData, Error>
  RightProof(): Result<ProofData, Error>
  ValidateSequence(
    firstSubtree: Node,
    secondSubtree: Node,
    root: Node
  ): Result<boolean, Error>
  ValidateLeafs(
    leafs: Uint8Array[],
    startIdx: number,
    tree: MerkleTree
  ): Result<boolean, Error>
}

export type Result<T, X> =
  | { ok: T; error?: undefined }
  | { error: X; ok?: undefined }
