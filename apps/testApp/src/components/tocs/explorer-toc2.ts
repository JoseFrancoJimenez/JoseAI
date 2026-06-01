import { BaseComponent } from '@lib/components/base-component.ts';
import { TocModel } from '@lib/components/toc/toc-model.ts';
import { TocComponent } from '@lib/widgets/toc/toc-component.ts';
import type { ITocNodeDef, ITocNode } from '@lib/components/toc/toc.types.ts';
class ExplorerToc2Component extends BaseComponent {
  static readonly tagName = 'explorer-toc2';

  #model: TocModel | null = null;
  #checked = new Map<string, boolean>();

  get #toc(): TocComponent {
    return this.querySelector<TocComponent>(TocComponent.tagName)!;
  }

  configure(defs: ITocNodeDef[]): void {
    this.#model = new TocModel(defs);
    this.#checked = new Map(
      defs.filter(d => d.type === 'layer').map(d => [d.id, false])
    );
    if (this.isConnected) {
      this.innerHTML = this.html();
      this.#toc.setup(this.#model, (node: ITocNode) => this.#buildNode(node));
      this.bindEvents();
    }
  }

  connectedCallback(): void {
    this.innerHTML = this.html();
    if (this.#model) this.#toc.setup(this.#model, (node: ITocNode) => this.#buildNode(node));
    this.bindEvents();
  }

  html(): string {
    return `<${TocComponent.tagName}></${TocComponent.tagName}>`;
  }

  protected bindEvents(): void {}

  protected cleanup(): void {}

  #buildNode(node: ITocNode): HTMLElement {
    if (node.type === 'layer') {
      const label = document.createElement('label');
      label.className = 'toc-layer';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = this.#checked.get(node.id) ?? false;
      cb.addEventListener('change', () => {
        this.#checked.set(node.id, cb.checked);
        const n = this.#model!.get(node.id)!;
        const parent = n.parent ? n.parent.id : 'root';
        alert(`Node: ${n.id}\nType: ${n.type}\nDepth: ${n.depth}\nParent: ${parent}\nChecked: ${cb.checked}`);
      });

      const span = document.createElement('span');
      span.className = 'toc-layer-name';
      span.textContent = node.id;

      label.append(cb, span);
      return label;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'toc-group';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    cb.addEventListener('change', () => {
      console.log(`[BUG DEMO] "${node.id}" visibility → ${cb.checked}. Did the group also expand/collapse?`);
    });

    const span = document.createElement('span');
    span.className = 'toc-group-name';
    span.textContent = node.id;

    wrapper.append(cb, span);
    return wrapper;
  }
}

if (!customElements.get(ExplorerToc2Component.tagName)) {
  customElements.define(ExplorerToc2Component.tagName, ExplorerToc2Component);
}

export { ExplorerToc2Component };
