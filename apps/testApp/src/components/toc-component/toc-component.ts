import './toc-component.css';
import type { ITreeNode } from '@lib/components/tree/tree.types.ts';
import type { Tree } from '@lib/components/tree/tree.ts';
import type { Subscription } from '@lib/components/evented.ts';
import { BaseComponent } from '@lib/components/base-component.ts';

/**
 * Table of contents web component.
 *
 * Usage:
 * ```ts
 * const toc = document.createElement(TocComponent.tagName) as TocComponent;
 * toc.setup(tree, data => data.label);
 * container.appendChild(toc);
 * ```
 *
 * Emits:
 * - `toc:select`   — bubbles, detail is the clicked ITreeNode
 * - `toc:expand`   — bubbles, detail is `{ id: string }`
 * - `toc:collapse` — bubbles, detail is `{ id: string }`
 */
class TocComponent extends BaseComponent {
  static readonly tagName = 'toc-component';

  #tree: Tree<unknown> | null = null;
  #renderFn: ((data: unknown) => string) | null = null;
  #expanded: Set<string> = new Set();
  #subscription: Subscription | null = null;

  /**
   * Binds the component to a tree and a render function.
   * Must be called before the element is appended to the DOM.
   * Top-level nodes are expanded by default.
   */
  setup<T>(tree: Tree<T>, renderFn: (data: T) => string): void {
    this.#tree = tree as Tree<unknown>;
    this.#renderFn = renderFn as (data: unknown) => string;
    for (const node of tree.roots) this.#expanded.add(node.id);
  }

  html(): string {
    if (!this.#tree || !this.#renderFn) return '';
    const items = this.#tree.roots.map(n => this.#nodeHtml(n)).join('');
    return `<nav class="toc-panel"><ul class="toc-list">${items}</ul></nav>`;
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
    const isExpanded = this.#expanded.has(node.id);
    const label = this.#renderFn!(node.data);

    const toggleBtn = hasChildren
      ? `<button class="toc-toggle${isExpanded ? ' is-expanded' : ''}" data-id="${node.id}" aria-label="Toggle">
           <span class="toc-arrow">&#9658;</span>
         </button>`
      : `<span class="toc-indent"></span>`;

    const nested = hasChildren && isExpanded
      ? `<ul class="toc-list toc-list--nested">${node.children.map(c => this.#nodeHtml(c)).join('')}</ul>`
      : '';

    return `
      <li class="toc-item">
        <div class="toc-row">
          ${toggleBtn}
          <span class="toc-label" data-id="${node.id}">${label}</span>
        </div>
        ${nested}
      </li>`;
  }

  #handleClick = (e: Event): void => {
    const target = e.target as Element;
    const toggleEl = target.closest<HTMLElement>('.toc-toggle');
    const labelEl = target.closest<HTMLElement>('.toc-label');

    if (toggleEl?.dataset.id) {
      this.#toggleExpand(toggleEl.dataset.id);
    } else if (labelEl?.dataset.id) {
      const node = this.#tree!.findNodeById(labelEl.dataset.id);
      if (node) this.emit('toc:select', node);
    }
  };

  #toggleExpand(id: string): void {
    if (this.#expanded.has(id)) {
      this.#expanded.delete(id);
      this.emit('toc:collapse', { id });
    } else {
      this.#expanded.add(id);
      this.emit('toc:expand', { id });
    }
    this.render();
  }

  #refresh(): void {
    this.cleanup();
    this.render();
    this.bindEvents();
  }
}

if (!customElements.get(TocComponent.tagName)) {
  customElements.define(TocComponent.tagName, TocComponent);
}

export { TocComponent };
