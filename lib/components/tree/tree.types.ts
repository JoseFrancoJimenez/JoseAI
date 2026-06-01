/** Read-only view of a node returned by Tree operations. */
interface ITreeNode<T> {
  /** The item this node wraps. */
  readonly item: T;
  /** Direct children of this node. */
  readonly children: readonly ITreeNode<T>[];
  /** 0-based depth. Top-level nodes are 0. */
  readonly depth: number;
}

/** Event map for {@link Tree}. */
interface TreeEvents<T> {
  /** Fired after any structural mutation. */
  'change': object;
  /** Fired when a node is added. */
  'add': { node: ITreeNode<T> };
  /** Fired when a node and its subtree are removed. */
  'remove': { node: ITreeNode<T> };
  /** Fired when a node is reparented. `previousParent` is `null` if the node was at the top level. */
  'move': { node: ITreeNode<T>; previousParent: ITreeNode<T> | null };
}

export type { ITreeNode, TreeEvents };
