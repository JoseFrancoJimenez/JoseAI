import './legend.css';
import type { VectorAppLayer } from '@lib/maps/layers/vectorLayer.ts';
import { BaseComponent } from './base-component.ts';

class LegendComponent extends BaseComponent {
  static readonly tagName = 'map-legend';

  #layers: VectorAppLayer[] = [];
  #cleanupFns: (() => void)[] = [];

  setup(layers: VectorAppLayer[]): void {
    this.#layers = layers;
  }

  html(): string {
    const visible = this.#layers.filter(l => l.visible);
    if (!visible.length) return '';
    return `
      <div class="legend">
        ${visible.map(l => this.#sectionHtml(l)).join('<div class="legend-divider"></div>')}
      </div>
    `;
  }

  #sectionHtml(layer: VectorAppLayer): string {
    const { label, subLabel, items } = layer.legend;
    return `
      <div class="legend-section">
        <div class="legend-layer-title">${label}</div>
        ${subLabel ? `<div class="legend-layer-sublabel">${subLabel}</div>` : ''}
        <div class="legend-items">
          ${items.map(item => {
            const swatch = item.symbol
              ? `<img class="legend-icon" src="${item.symbol}" alt="">`
              : `<span class="legend-swatch" style="background-color:${item.color ?? 'transparent'}"></span>`;
            return `<div class="legend-item">${swatch}<span class="legend-item-label">${item.label}</span></div>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  protected bindEvents(): void {
    for (const layer of this.#layers) {
      const s1 = layer.on('change:variable', () => this.#refresh());
      const s2 = layer.on('change:visible',  () => this.#refresh());
      this.#cleanupFns.push(() => { s1.remove(); s2.remove(); });
    }
  }

  protected cleanup(): void {
    this.#cleanupFns.forEach(fn => fn());
    this.#cleanupFns = [];
  }

  #refresh(): void {
    this.cleanup();
    this.render();
    this.bindEvents();
  }
}

if (!customElements.get(LegendComponent.tagName)) {
  customElements.define(LegendComponent.tagName, LegendComponent);
}

export { LegendComponent };
