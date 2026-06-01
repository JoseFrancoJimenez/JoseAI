import { BaseComponent } from '@lib/components/base-component.ts';
import { TocModel } from '@lib/components/toc/toc-model.ts';
import { TocComponent } from '@lib/widgets/toc/toc-component.ts';
import type { ITocNodeDef, ITocNode } from '@lib/components/toc/toc.types.ts';
import type { VectorAppLayer } from '@lib/maps/layers/vectorLayer.ts';
import type { Subscription } from '@lib/components/evented.ts';
class LayerToc2Component extends BaseComponent {
  static readonly tagName = 'layer-toc2';

  #model: TocModel | null = null;
  #layerMap = new Map<string, VectorAppLayer>();
  #layerSubs: Subscription[] = [];

  get #toc(): TocComponent {
    return this.querySelector<TocComponent>(TocComponent.tagName)!;
  }

  configure(layers: VectorAppLayer[]): void {
    this.#layerMap = new Map(layers.map(l => [l.id, l]));
    const defs: ITocNodeDef[] = layers.map(l => ({ id: l.id, parent_id: null, type: 'layer' }));
    this.#model = new TocModel(defs);
    if (this.isConnected) {
      this.cleanup();
      this.innerHTML = this.html();
      this.#toc.setup(this.#model, node => this.#buildLayerNode(node));
      this.bindEvents();
    }
  }

  connectedCallback(): void {
    this.innerHTML = this.html();
    if (this.#model) this.#toc.setup(this.#model, node => this.#buildLayerNode(node));
    this.bindEvents();
  }

  html(): string {
    return `<${TocComponent.tagName}></${TocComponent.tagName}>`;
  }

  protected bindEvents(): void {}

  protected cleanup(): void {
    for (const sub of this.#layerSubs) sub.remove();
    this.#layerSubs = [];
  }

  #buildLayerNode(node: ITocNode): HTMLElement {
    const layer = this.#layerMap.get(node.id);
    if (!layer) {
      const span = document.createElement('span');
      span.textContent = node.id;
      return span;
    }

    const block = document.createElement('div');
    block.className = 'toc-layer-block';

    const header = document.createElement('div');
    header.className = 'toc-layer-block-header';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = layer.visible;
    cb.addEventListener('change', () => { layer.visible = cb.checked; });

    const title = document.createElement('span');
    title.className = 'toc-layer-block-title';
    title.textContent = layer.label;

    header.append(cb, title);
    block.appendChild(header);

    if (layer.variables.length > 0) {
      const select = document.createElement('select');
      select.className = 'toc-layer-block-select';
      for (const v of layer.variables) {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = v.legend?.label ?? v.id;
        opt.selected = v.id === layer.variable?.id;
        select.appendChild(opt);
      }
      select.addEventListener('change', () => { layer.setVariable(select.value); });
      block.appendChild(select);
    }

    const legendEl = this.#buildLegend(layer);
    if (legendEl) block.appendChild(legendEl);

    return block;
  }

  #buildLegend(layer: VectorAppLayer): HTMLElement | null {
    if (!layer.legend.items.length) return null;

    const legend = document.createElement('div');
    legend.className = 'toc-legend';

    for (const item of layer.legend.items) {
      const row = document.createElement('div');
      row.className = 'toc-legend-item';

      if (item.symbol) {
        const img = document.createElement('img');
        img.className = 'toc-legend-icon';
        img.src = item.symbol;
        img.alt = '';
        row.appendChild(img);
      } else {
        const swatch = document.createElement('span');
        swatch.className = 'toc-legend-swatch';
        swatch.style.backgroundColor = item.color ?? 'transparent';
        row.appendChild(swatch);
      }

      const label = document.createElement('span');
      label.className = 'toc-legend-label';
      label.textContent = item.label;
      row.appendChild(label);

      legend.appendChild(row);
    }

    return legend;
  }
}

if (!customElements.get(LayerToc2Component.tagName)) {
  customElements.define(LayerToc2Component.tagName, LayerToc2Component);
}

export { LayerToc2Component };
