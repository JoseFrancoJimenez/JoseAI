import './toc-component.css';
import type { TocModel } from '../../components/toc/toc-model.ts';
import type { ITocNode } from '../../components/toc/toc.types.ts';
import type { Subscription } from '../../components/evented.ts';

/**
 * Renders a {@link TocModel} as an interactive, expandable tree panel.
 *
 * Pass a `renderNode` function to {@link setup} to control what each node displays.
 * The component handles the tree structure — indentation, expand/collapse toggles, and nesting.
 * When `renderNode` is omitted, {@link defaultRenderer} is used as the fallback.
 *
 * Child nodes are built lazily: they are added to the DOM on expand and removed on collapse.
 * The component re-renders the visible tree whenever the model fires `add`, `remove`, `move`, or `clear`.
 */
class TocComponent extends HTMLElement {
  /** Custom element tag name. Use with `document.createElement` or as an HTML tag. */
  static readonly tagName = 'toc-component';

  /** Selector matching elements that should not trigger an expand/collapse when clicked. */
  static readonly interactiveSelector = 'input, button, select, textarea, a[href]';

  /** CSS class names used by this component. Override in a subclass to restyle without touching logic. */
  static readonly css = {
    root:              TocComponent.tagName,
    list:              'toc-list',
    listNested:        'toc-list--nested',
    treeNode:          'toc-node',
    nodeLabel:         'toc-node-label',
    row:               'toc-row',
    toggle:            'toc-toggle',
    arrow:             'toc-arrow',
    indent:            'toc-indent',
    content:           'toc-content',
    contentExpandable: 'toc-content--expandable',
    expanded:          'is-expanded',
  } as const;

  #model: TocModel | null = null;
  #renderNode: ((node: ITocNode) => HTMLElement) | null = null;
  #expanded: Set<string> = new Set();
  #subscriptions: Subscription[] = [];

  /**
   * HTML string rendered inside each toggle button as the expand/collapse icon.
   * Override in a subclass to swap the icon without touching the rest of the component.
   * @returns The SVG markup string for the arrow icon.
   */
  protected get expandIconHtml(): string {
    return `<svg class="${TocComponent.css.arrow}" viewBox="0 0 6 10" aria-hidden="true"><path d="M1 1l4 4-4 4"/></svg>`;
  }

  /** Called by the browser when the element is inserted into the DOM. Renders and binds events. */
  connectedCallback(): void {
    this.classList.add(TocComponent.css.root);
    this.render();
    this.bindEvents();
  }

  /** Called by the browser when the element is removed from the DOM. Runs cleanup. */
  disconnectedCallback(): void {
    this.cleanup();
  }

  /**
   * Renders `node.id` in a `<span>` styled by `TocComponent.css.nodeLabel`.
   * Override in a subclass to change the fallback used when no `renderNode`
   * function is passed to {@link setup}.
   * @param node - The tree node to render.
   * @returns A `<span>` element containing the node's id as text.
   */
  protected defaultRenderer(node: ITocNode): HTMLElement {
    const span = document.createElement('span');
    span.className = TocComponent.css.nodeLabel;
    span.textContent = node.id;
    return span;
  }

  /**
   * Binds the component to a model and an optional node renderer.
   * May be called before or after the element is connected to the DOM.
   * All nodes start collapsed.
   * @param model - The {@link TocModel} to render.
   * @param renderNode - function called once per node per render cycle. When omitted, {@link defaultRenderer} is used.
   */
  setup(model: TocModel, renderNode?: (node: ITocNode) => HTMLElement): void {
    this.#model = model;
    this.#renderNode = renderNode ?? null;
    this.#expanded.clear();
    if (this.isConnected) {
      this.cleanup();
      this.render();
      this.bindEvents();
    }
  }

  /** Renders the component based on the current model state. */
  protected render(): void {
    if (!this.#model) { this.replaceChildren(); return; }
    const ul = document.createElement('ul');
    ul.className = TocComponent.css.list;
    for (const root of this.#model.roots) ul.appendChild(this.#buildNode(root));
    this.replaceChildren(ul);
  }

  /**
   * Subscribes to model events and attaches the root click handler.
   * No-ops if already bound or if no model is set.
   */
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

  /** Removes all model subscriptions and the root click handler. */
  protected cleanup(): void {
    for (const sub of this.#subscriptions) sub.remove();
    this.#subscriptions = [];
    this.removeEventListener('click', this.#handleClick);
  }

  /**
   * Builds the `<li>` for a single node, including its toggle button (or indent spacer),
   * content wrapper, and — when already expanded — its nested child list.
   * @param node - The tree node to build.
   * @returns The `<li>` element representing the node.
   */
  #buildNode(node: ITocNode): HTMLElement {
    const { treeNode, expanded, row, toggle, indent, content, contentExpandable } = TocComponent.css;
    const hasChildren = node.children.length > 0;
    const isExpanded = this.#expanded.has(node.id);

    // Root <li>, carries the node id as a data attribute for event delegation
    const li = document.createElement('li');
    li.className = treeNode;
    if (isExpanded) li.classList.add(expanded);
    li.dataset.nodeId = node.id;

    // Row flex, container holding the toggle/indent and the content area
    const rowEl = document.createElement('div');
    rowEl.className = row;

    // Toggle button (parent nodes) or indent spacer (leaf nodes)
    if (hasChildren) {
      // Create expand element
      const btn = document.createElement('button');
      btn.className = toggle;
      if (isExpanded) btn.classList.add(expanded); // mirrors initial state
      btn.dataset.nodeId = node.id;                // used by #handleClick for delegation
      btn.setAttribute('aria-label', `Toggle ${node.id}`);
      btn.setAttribute('aria-expanded', String(isExpanded));
      btn.innerHTML = this.expandIconHtml;         // icon — override expandIconHtml to customise
      rowEl.appendChild(btn);
    } else {
      // Leaf node, spacer keeps content aligned with parent rows
      const indentEl = document.createElement('span');
      indentEl.className = indent;
      rowEl.appendChild(indentEl);
    }

    // Content area, consumer-supplied element or defaultRenderer fallback
    const contentWrapper = document.createElement('div');
    contentWrapper.className = hasChildren ? `${content} ${contentExpandable}` : content;
    if (hasChildren) contentWrapper.dataset.toggleId = node.id;
    contentWrapper.appendChild(this.#renderNode ? this.#renderNode(node) : this.defaultRenderer(node));
    rowEl.appendChild(contentWrapper);
    li.appendChild(rowEl);

    // Child list, only appended when already expanded (lazy otherwise)
    if (hasChildren && isExpanded) {
      li.appendChild(this.#buildChildList(node));
    }

    return li;
  }

  /**
   * Wraps all children of `node` in a nested `<ul>`.
   * @param node - The parent node whose children to render.
   * @returns A `<ul>` element containing one `<li>` per child.
   */
  #buildChildList(node: ITocNode): HTMLElement {
    const { list, listNested } = TocComponent.css;
    const ul = document.createElement('ul');
    ul.className = `${list} ${listNested}`;
    for (const child of node.children) ul.appendChild(this.#buildNode(child));
    return ul;
  }

  /**
   * Delegated click handler for the entire component.
   * Intercepts clicks on `.toc-toggle` buttons and on expandable content areas,
   * stopping propagation in both cases. All other clicks bubble normally.
   * @param ev - The mouse event from the delegated listener.
   */
  #handleClick = (ev: MouseEvent): void => {
    const { toggle, contentExpandable } = TocComponent.css;
    const target = ev.target as Element;

    // Click on the toggle button (highest priority, always fires)
    const toggleEl = target.closest<HTMLElement>(`.${toggle}`);
    if (toggleEl?.dataset.nodeId) {
      ev.stopPropagation();
      this.#toggle(toggleEl.dataset.nodeId);
      return;
    }

    // Click on expandable content area (skipped if the click landed on an interactive element)
    const expandableContent = target.closest<HTMLElement>(`.${contentExpandable}`);
    if (expandableContent?.dataset.toggleId && !target.closest(TocComponent.interactiveSelector)) {
      ev.stopPropagation();
      this.#toggle(expandableContent.dataset.toggleId);
    }
  };

  /**
   * Toggles the expand/collapse state of the node identified by `id`.
   * Surgically appends or removes the nested child list without re-rendering siblings.
   * @param id - The id of the node to toggle.
   */
  #toggle(id: string): void {
    const { treeNode, expanded, toggle, listNested } = TocComponent.css;

    // Update expanded state
    const isExpanded = this.#expanded.has(id);
    if (isExpanded) this.#expanded.delete(id);
    else this.#expanded.add(id);

    // Sync classes and aria attributes on the DOM node
    const nodeEl = [...this.querySelectorAll<HTMLElement>(`.${treeNode}`)]
      .find(el => el.dataset.nodeId === id) ?? null;
    if (!nodeEl) return;

    nodeEl.classList.toggle(expanded, !isExpanded);
    const toggleBtn = nodeEl.querySelector<HTMLElement>(`.${toggle}`);
    toggleBtn?.classList.toggle(expanded, !isExpanded);
    toggleBtn?.setAttribute('aria-expanded', String(!isExpanded));

    // Append or remove the child list
    if (!isExpanded) {
      const tocNode = this.#model?.get(id);
      if (tocNode) nodeEl.appendChild(this.#buildChildList(tocNode));
    } else {
      nodeEl.querySelector(`.${listNested}`)?.remove();
    }
  }

  /**
   * Recursively removes `node` and its entire subtree from the expanded set.
   * @param node - The root of the subtree to prune.
   */
  #pruneExpanded(node: ITocNode): void {
    this.#expanded.delete(node.id);
    for (const child of node.children) this.#pruneExpanded(child);
  }
}

if (!customElements.get(TocComponent.tagName)) {
  customElements.define(TocComponent.tagName, TocComponent);
}

export { TocComponent };
