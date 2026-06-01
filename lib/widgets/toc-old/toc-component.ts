import './toc-component.css';
import { BaseComponent } from '../../components/base-component.ts';
import type { TocModel } from '../../components/toc/toc-model.ts';
import type { ITocNode } from '../../components/toc/toc.types.ts';
import type { Subscription } from '../../components/evented.ts';

/**
 * Renders a {@link TocModel} as an expandable tree panel.
 *
 * The consumer supplies a `renderNode` function that returns the HTML for each
 * node's content area (label, controls, etc.). The component owns the tree
 * chrome: indentation, expand/collapse toggles, and nesting.
 *
 * **Events:** all DOM events from node content bubble naturally out of the
 * component. The component only intercepts clicks on the expand/collapse toggle
 * and expandable-node labels (both handled internally). To identify which node
 * an event came from, use `event.target.closest('.toc-node')?.dataset.nodeId`.
 *
 * ```ts
 * const toc = document.createElement(TocComponent.tagName) as TocComponent;
 * toc.setup(model, node => `<span>${node.id}</span>`);
 * container.appendChild(toc);
 *
 * toc.addEventListener('change', (e: Event) => {
 *   const nodeId = (e.target as Element).closest<HTMLElement>('.toc-node')?.dataset.nodeId;
 * });
 * ```
 */
class TocComponent extends BaseComponent {
  static readonly tagName = 'toc-component';

  connectedCallback(): void {
    this.classList.add('toc-component');
    super.connectedCallback();
  }

  #model: TocModel | null = null;
  #renderNode: ((node: ITocNode) => string) | null = null;
  #expanded: Set<string> = new Set();
  #subscriptions: Subscription[] = [];

  /**
   * Binds the component to a model and a node renderer.
   *
   * May be called before or after the element is appended to the DOM:
   * - **Before connection** (typical): the component renders normally on `connectedCallback`.
   * - **After connection**: triggers an immediate `cleanup → render → bindEvents` cycle.
   *
   * All nodes start collapsed.
   */
  setup(model: TocModel, renderNode: (node: ITocNode) => string): void {
    this.#model = model;
    this.#renderNode = renderNode;
    this.#expanded.clear();
    if (this.isConnected) {
      this.cleanup();
      this.render();
      this.bindEvents();
    }
  }

  html(): string {
    const model = this.#model;
    const renderNode = this.#renderNode;
    if (!model || !renderNode) return '';
    const rows = model.roots.map(n => this.#nodeHtml(n)).join('');
    return `<ul class="toc-list">${rows}</ul>`;
  }

  protected bindEvents(): void {
    if (!this.#model || this.#subscriptions.length) return;
    this.#subscriptions = [
      this.#model.on('add',    () => this.render()),
      this.#model.on('remove', ({ node }) => { this.#pruneExpanded(node); this.render(); }),
      this.#model.on('move',   () => this.render()),
      this.#model.on('clear',  () => { this.#expanded.clear(); this.render(); }),
    ];
    this.addEventListener('click', this.#handleClick);
  }

  protected cleanup(): void {
    for (const sub of this.#subscriptions) sub.remove();
    this.#subscriptions = [];
    this.removeEventListener('click', this.#handleClick);
  }

  #nodeHtml(node: ITocNode): string {
    const hasChildren = node.children.length > 0;
    const isExpanded = this.#expanded.has(node.id);

    const toggle = hasChildren
      ? `<button class="toc-toggle${isExpanded ? ' is-expanded' : ''}" data-node-id="${node.id}" aria-label="Toggle ${node.id}">
           <svg class="toc-arrow" viewBox="0 0 6 10" aria-hidden="true"><path d="M1 1l4 4-4 4"/></svg>
         </button>`
      : `<span class="toc-indent"></span>`;

    const contentAttrs = hasChildren
      ? ` class="toc-content toc-content--expandable" data-toggle-id="${node.id}"`
      : ` class="toc-content"`;

    const children = hasChildren
      ? `<ul class="toc-list toc-list--nested">${node.children.map(c => this.#nodeHtml(c)).join('')}</ul>`
      : '';

    return `
      <li class="toc-node${isExpanded ? ' is-expanded' : ''}" data-node-id="${node.id}">
        <div class="toc-row">
          ${toggle}
          <div${contentAttrs}>${this.#renderNode!(node)}</div>
        </div>
        ${children}
      </li>`;
  }

  #handleClick = (e: MouseEvent): void => {
    const target = e.target as Element;

    const toggleEl = target.closest<HTMLElement>('.toc-toggle');
    if (toggleEl?.dataset.nodeId) {
      e.stopPropagation();
      this.#toggle(toggleEl.dataset.nodeId);
      return;
    }

    const expandableContent = target.closest<HTMLElement>('.toc-content--expandable');
    if (expandableContent?.dataset.toggleId) {
      e.stopPropagation();
      this.#toggle(expandableContent.dataset.toggleId);
    }
  };

  #toggle(id: string): void {
    const nowExpanded = !this.#expanded.has(id);
    if (nowExpanded) this.#expanded.add(id);
    else this.#expanded.delete(id);

    const nodeEl = this.querySelector<HTMLElement>(`.toc-node[data-node-id="${id}"]`);
    if (!nodeEl) return;
    nodeEl.classList.toggle('is-expanded', nowExpanded);
    nodeEl.querySelector('.toc-toggle')?.classList.toggle('is-expanded', nowExpanded);
  }

  #pruneExpanded(node: ITocNode): void {
    this.#expanded.delete(node.id);
    for (const child of node.children) this.#pruneExpanded(child);
  }

}

if (!customElements.get(TocComponent.tagName)) {
  customElements.define(TocComponent.tagName, TocComponent);
}

export { TocComponent };
