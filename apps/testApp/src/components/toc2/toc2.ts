import './toc2.css';
import { TreeComponent } from '@lib/widgets/tree/tree-component.ts';
import { Tree } from '@lib/components/tree/tree.ts';
import type { VectorAppLayer } from '@lib/maps/layers/vectorLayer.ts';

class Toc2Component extends TreeComponent {
  static override readonly tagName = 'toc-2';

  #layers: VectorAppLayer[] = [];
  #layerSubs: Array<{ remove(): void }> = [];
  #changeHandler: ((e: Event) => void) | null = null;

  configure(layers: VectorAppLayer[]): void {
    this.#layers = layers;
    const tree = new Tree<VectorAppLayer>();
    for (const layer of layers) tree.addNode(layer);
    super.setup(tree, layer => this.#layerNodeHtml(layer), layer => layer.id);
  }

  protected override bindEvents(): void {
    super.bindEvents();

    this.#changeHandler = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      const layerId = target.dataset['layerId'];
      if (!layerId) return;
      const layer = this.#layers.find(l => l.id === layerId);
      if (!layer) return;
      if (target instanceof HTMLInputElement) {
        layer.visible = target.checked;
      } else if (target instanceof HTMLSelectElement) {
        layer.setVariable(target.value);
      }
    };
    this.addEventListener('change', this.#changeHandler);

    this.#layerSubs = this.#layers.flatMap(layer => [
      layer.on('change:variable', () => this.render()),
      layer.on('change:visible',  () => this.render()),
    ]);
  }

  protected override cleanup(): void {
    if (this.#changeHandler) {
      this.removeEventListener('change', this.#changeHandler);
      this.#changeHandler = null;
    }
    for (const sub of this.#layerSubs) sub.remove();
    this.#layerSubs = [];
    super.cleanup();
  }

  #layerNodeHtml(layer: VectorAppLayer): string {
    const { items } = layer.legend;
    const legendHtml = items.map(item => {
      const swatch = item.symbol
        ? `<img class="legend-icon" src="${item.symbol}" alt="">`
        : `<span class="legend-swatch" style="background-color:${item.color ?? 'transparent'}"></span>`;
      return `<div class="legend-item">${swatch}<span class="legend-item-label">${item.label}</span></div>`;
    }).join('');

    return `
      <div class="layer-block">
        <div class="layer-block-title">${layer.label}</div>
        <div class="layer-block-row">
          <input type="checkbox" data-layer-id="${layer.id}" ${layer.visible ? 'checked' : ''}>
          <label>Visible</label>
          ${layer.variables.length > 0 ? `
            <select data-layer-id="${layer.id}" class="layer-block-select">
              ${layer.variables.map(v => `<option value="${v.id}"${v.id === layer.variable?.id ? ' selected' : ''}>${v.id}</option>`).join('')}
            </select>
          ` : ''}
        </div>
        ${legendHtml ? `<div class="legend-items">${legendHtml}</div>` : ''}
      </div>
    `;
  }
}

if (!customElements.get(Toc2Component.tagName)) {
  customElements.define(Toc2Component.tagName, Toc2Component);
}

export { Toc2Component };
