import Evented from '../evented.ts';
import type { ITreeNode, TreeEvents } from './tree.types.ts';

class TreeNode<T> implements ITreeNode<T> {
  readonly item: T;
  parent: TreeNode<T> | null;
  readonly children: TreeNode<T>[];
  depth: number;

  constructor(item: T, parent: TreeNode<T> | null, depth: number) {
    this.item = item;
    this.parent = parent;
    this.children = [];
    this.depth = depth;
  }
}

/**
 * Generic tree backed by a hidden root node.
 * Extends {@link Evented} — subscribe to `'change'`, `'add'`, `'remove'`, or `'move'`.
 * Iterable in depth-first order via `for...of`.
 *
 * ```ts
 * const tree = new Tree<Person>();
 * tree.addNode(alice);
 * tree.addNode(bob, alice); // child of alice
 *
 * for (const node of tree) console.log(node.item);
 * ```
 */
class Tree<T> extends Evented<TreeEvents<T>> {
  readonly #root: TreeNode<T>;
  readonly #nodes = new Map<T, TreeNode<T>>();

  constructor() {
    super();
    this.#root = new TreeNode<T>(null as unknown as T, null, -1);
  }

  /** Total number of nodes in the tree. */
  get size(): number {
    return this.#nodes.size;
  }

  /** Top-level nodes (direct children of the hidden root). */
  get roots(): readonly ITreeNode<T>[] {
    return this.#root.children;
  }

  /**
   * Adds `item` to the tree.
   * Pass `parentItem` to nest it under an existing node; omit to add at the top level.
   * Throws if `item` is already in the tree.
   */
  addNode(item: T, parentItem?: T): ITreeNode<T> {
    if (this.#nodes.has(item)) throw new Error(`Tree: item already exists`);
    const parent = parentItem !== undefined ? this.#getNode(parentItem) : this.#root;
    const node = new TreeNode(item, parent, parent === this.#root ? 0 : parent.depth + 1);
    parent.children.push(node);
    this.#nodes.set(item, node);
    this.emit('add', { node });
    this.emit('change', {});
    return node;
  }

  /**
   * Removes `item` and its entire subtree from the tree.
   * Throws if `item` is not in the tree.
   */
  removeNode(item: T): void {
    const node = this.#getNode(item);
    this.#detach(node);
    this.#pruneRegistry(node);
    this.emit('remove', { node });
    this.emit('change', {});
  }

  /**
   * Reparents `item` under `newParentItem`.
   * Omit `newParentItem` to move the item to the top level.
   * Throws if the move would create a cycle.
   */
  move(item: T, newParentItem?: T): void {
    const node = this.#getNode(item);
    const newParent = newParentItem !== undefined ? this.#getNode(newParentItem) : this.#root;

    let ancestor: TreeNode<T> | null = newParent;
    while (ancestor !== null) {
      if (ancestor === node) throw new Error(`Tree: cannot move an item into its own subtree`);
      ancestor = ancestor.parent;
    }

    const previousParent = node.parent !== this.#root ? node.parent : null;
    this.#detach(node);
    node.parent = newParent;
    node.depth = newParent === this.#root ? 0 : newParent.depth + 1;
    this.#updateChildDepths(node);
    newParent.children.push(node);
    this.emit('move', { node, previousParent });
    this.emit('change', {});
  }

  /** Removes all nodes from the tree. */
  clear(): void {
    this.#root.children.length = 0;
    this.#nodes.clear();
    this.emit('change', {});
  }

  /** Returns `true` if `item` is in the tree. */
  has(item: T): boolean {
    return this.#nodes.has(item);
  }

  /** Returns the first node whose item satisfies `predicate`, in depth-first order. */
  find(predicate: (item: T) => boolean): ITreeNode<T> | undefined {
    for (const node of this) {
      if (predicate(node.item)) return node;
    }
    return undefined;
  }

  /** Iterates all nodes depth-first. */
  *[Symbol.iterator](): IterableIterator<ITreeNode<T>> {
    for (const root of this.#root.children) yield* this.#walk(root);
  }

  *#walk(node: TreeNode<T>): IterableIterator<TreeNode<T>> {
    yield node;
    for (const child of node.children) yield* this.#walk(child);
  }

  #getNode(item: T): TreeNode<T> {
    const node = this.#nodes.get(item);
    if (!node) throw new Error(`Tree: item not found`);
    return node;
  }

  #detach(node: TreeNode<T>): void {
    const siblings = node.parent!.children;
    const idx = siblings.indexOf(node);
    if (idx !== -1) siblings.splice(idx, 1);
  }

  #updateChildDepths(node: TreeNode<T>): void {
    for (const child of node.children) {
      child.depth = node.depth + 1;
      this.#updateChildDepths(child);
    }
  }

  #pruneRegistry(node: TreeNode<T>): void {
    this.#nodes.delete(node.item);
    for (const child of node.children) this.#pruneRegistry(child);
  }
}

export { Tree };
