import './tree-component.css';
import { BaseComponent } from '../../components/base-component.ts';
import type { ITreeNode } from '../../components/tree/tree.types.ts';
import type { Tree } from '../../components/tree/tree.ts';
import type { Subscription } from '../../components/evented.ts';

/**
 * Generic tree web component. Renders a {@link Tree} as a nested expandable list.
 *
 * Usage:
 * ```ts
 * const el = document.createElement(TreeComponent.tagName) as TreeComponent;
 * el.setup(tree, item => item.label, item => item.id);
 * container.appendChild(el);
 * ```
 *
 * Emits:
 * - `tree:select`   — bubbles, detail is the clicked {@link ITreeNode}
 * - `tree:expand`   — bubbles, detail is the expanded {@link ITreeNode}
 * - `tree:collapse` — bubbles, detail is the collapsed {@link ITreeNode}
 */
class TreeComponent extends BaseComponent {
  static readonly tagName = 'tree-component';

  #tree: Tree<unknown> | null = null;
  #renderFn: ((item: unknown) => string) | null = null;
  #keyFn: ((item: unknown) => string) | null = null;
  #expanded: Set<unknown> = new Set();
  #subscription: Subscription | null = null;

  /**
   * Binds the component to a tree model.
   * @param tree     - The tree to render.
   * @param renderFn - Returns the display label for an item.
   * @param keyFn    - Returns a stable unique string for an item (used for DOM identification).
   */
  setup<T>(tree: Tree<T>, renderFn: (item: T) => string, keyFn: (item: T) => string): void {
    this.#tree = tree as Tree<unknown>;
    this.#renderFn = renderFn as (item: unknown) => string;
    this.#keyFn = keyFn as (item: unknown) => string;
    for (const node of tree.roots) this.#expanded.add(node.item);
  }

  html(): string {
    if (!this.#tree) return '';
    const items = this.#tree.roots.map(n => this.#nodeHtml(n)).join('');
    return `<ul class="tree-list">${items}</ul>`;
  }

  protected bindEvents(): void {
    if (!this.#tree) return;
    this.#subscription = this.#tree.on('change', () => this.#refresh());
    this.addEventListener('click', this.#handleClick);
  }

  protected cleanup(): void {
    this.#subscription?.remove();
    this.#subscription = null;
    this.removeEventListener('click', this.#handleClick);
  }

  #nodeHtml(node: ITreeNode<unknown>): string {
    const hasChildren = node.children.length > 0;
    const isExpanded = this.#expanded.has(node.item);
    const label = this.#renderFn!(node.item);
    const key = this.#keyFn!(node.item);

    const toggle = hasChildren
      ? `<button class="tree-toggle${isExpanded ? ' is-expanded' : ''}" data-key="${key}" aria-label="Toggle">
           <span class="tree-arrow">&#9658;</span>
         </button>`
      : `<span class="tree-indent"></span>`;

    const nested = hasChildren && isExpanded
      ? `<ul class="tree-list tree-list--nested">${node.children.map(c => this.#nodeHtml(c)).join('')}</ul>`
      : '';

    return `
      <li class="tree-item">
        <div class="tree-row">
          ${toggle}
          <div class="tree-label" data-key="${key}">${label}</div>
        </div>
        ${nested}
      </li>`;
  }

  #handleClick = (e: Event): void => {
    const target = e.target as Element;
    const toggleEl = target.closest<HTMLElement>('.tree-toggle');
    const labelEl = target.closest<HTMLElement>('.tree-label');

    if (toggleEl?.dataset.key) {
      const node = this.#tree!.find(item => this.#keyFn!(item) === toggleEl.dataset.key);
      if (node) this.#toggle(node);
    } else if (labelEl?.dataset.key) {
      const node = this.#tree!.find(item => this.#keyFn!(item) === labelEl.dataset.key);
      if (node) this.emit('tree:select', node);
    }
  };

  #toggle(node: ITreeNode<unknown>): void {
    if (this.#expanded.has(node.item)) {
      this.#expanded.delete(node.item);
      this.emit('tree:collapse', node);
    } else {
      this.#expanded.add(node.item);
      this.emit('tree:expand', node);
    }
    this.render();
  }

  #refresh(): void {
    this.cleanup();
    this.render();
    this.bindEvents();
  }
}

if (!customElements.get(TreeComponent.tagName)) {
  customElements.define(TreeComponent.tagName, TreeComponent);
}

export { TreeComponent };
