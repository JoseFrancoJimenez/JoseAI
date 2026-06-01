import './layer-block.css';
import { BaseComponent } from '@lib/components/base-component.ts';
import type { VectorAppLayer } from '@lib/maps/layers/vectorLayer.ts';
import type { LegendItem } from '@lib/maps/layers/types.ts';

class LayerBlockComponent extends BaseComponent {
  static readonly tagName = 'layer-block';

  #layer: VectorAppLayer | null = null;
  #subs: Array<{ remove(): void }> = [];

  setup(layer: VectorAppLayer): void {
    this.#layer = layer;
    if (this.isConnected) {
      this.cleanup();
      this.render();
      this.bindEvents();
    }
  }

  html(): string {
    if (!this.#layer) return '';
    const layer = this.#layer;
    const { items } = layer.legend;

    return `
      <div class="layer-block-title">${layer.label}</div>
      <div class="layer-block-row">
        <input type="checkbox" ${layer.visible ? 'checked' : ''}>
        <label>Visible</label>
        ${layer.variables.length > 0 ? `
          <select class="layer-block-select">
            ${layer.variables.map(v => `<option value="${v.id}"${v.id === layer.variable?.id ? ' selected' : ''}>${v.id}</option>`).join('')}
          </select>
        ` : ''}
      </div>
      ${items.length ? `<div class="legend-items">${this.#legendItemsHtml(items)}</div>` : ''}
    `;
  }

  protected bindEvents(): void {
    if (!this.#layer) return;
    this.addEventListener('change', this.#handleChange);
    this.#subs = [
      this.#layer.on('change:variable', () => this.#onVariableChange()),
      this.#layer.on('change:visible',  () => this.#onVisibleChange()),
    ];
  }

  protected cleanup(): void {
    this.removeEventListener('change', this.#handleChange);
    for (const s of this.#subs) s.remove();
    this.#subs = [];
  }

  #handleChange = (e: Event): void => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    if (!this.#layer) return;
    if (target instanceof HTMLInputElement) {
      this.#layer.visible = target.checked;
    } else if (target instanceof HTMLSelectElement) {
      this.#layer.setVariable(target.value);
    }
  };

  #onVariableChange(): void {
    const { items } = this.#layer!.legend;
    const legendEl = this.querySelector('.legend-items');
    if (legendEl) legendEl.innerHTML = this.#legendItemsHtml(items);
    const select = this.querySelector<HTMLSelectElement>('select');
    if (select && this.#layer!.variable) select.value = this.#layer!.variable.id;
  }

  #onVisibleChange(): void {
    const cb = this.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (cb) cb.checked = this.#layer!.visible;
  }

  #legendItemsHtml(items: LegendItem[]): string {
    return items.map(item => {
      const swatch = item.symbol
        ? `<img class="legend-icon" src="${item.symbol}" alt="">`
        : `<span class="legend-swatch" style="background-color:${item.color ?? 'transparent'}"></span>`;
      return `<div class="legend-item">${swatch}<span class="legend-item-label">${item.label}</span></div>`;
    }).join('');
  }
}

if (!customElements.get(LayerBlockComponent.tagName)) {
  customElements.define(LayerBlockComponent.tagName, LayerBlockComponent);
}

export { LayerBlockComponent };
