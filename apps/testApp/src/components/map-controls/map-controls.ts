import './map-controls.css';
import type { VectorAppLayer } from '@lib/maps/layers/vectorLayer.ts';
import { BaseComponent } from '@lib/components/base-component.ts';
import { LegendComponent } from '../legend/legend.ts';

class MapControlsComponent extends BaseComponent {
  static readonly tagName = 'map-controls';

  #layers: VectorAppLayer[] = [];
  #cleanupFns: (() => void)[] = [];

  setup(layers: VectorAppLayer[]): void {
    this.#layers = layers;
  }

  html(): string {
    if (!this.#layers.length) return '';
    return `
      <div class="map-controls-panel">
        ${this.#layers.map(l => this.#layerBlockHtml(l)).join('')}
      </div>
    `;
  }

  protected bindEvents(): void {
    for (const layer of this.#layers) {
      this.#wireCheckbox(`${layer.id}-visible`, layer);
      this.#wireSelect(`${layer.id}-variable`, layer);

      const legend = document.createElement(LegendComponent.tagName) as LegendComponent;
      legend.setup([layer]);
      this.querySelector(`#${layer.id}-legend`)!.appendChild(legend);
    }
  }

  protected cleanup(): void {
    this.#cleanupFns.forEach(fn => fn());
    this.#cleanupFns = [];
  }

  #layerBlockHtml(layer: VectorAppLayer): string {
    return `
      <div class="layer-block">
        <div class="layer-block-title">${layer.label}</div>
        <div class="layer-block-row">
          <input type="checkbox" id="${layer.id}-visible" ${layer.visible ? 'checked' : ''}>
          <label for="${layer.id}-visible">Visible</label>
          <select id="${layer.id}-variable" class="layer-block-select">
            ${layer.variables.map(v => `<option value="${v.id}"${v.id === layer.variable.id ? ' selected' : ''}>${v.id}</option>`).join('')}
          </select>
        </div>
        <div id="${layer.id}-legend"></div>
      </div>
    `;
  }

  #wireCheckbox(id: string, layer: VectorAppLayer): void {
    const el = this.querySelector<HTMLInputElement>(`#${id}`)!;
    const handler = () => { layer.visible = el.checked; };
    el.addEventListener('change', handler);
    this.#cleanupFns.push(() => el.removeEventListener('change', handler));
  }

  #wireSelect(id: string, layer: VectorAppLayer): void {
    const el = this.querySelector<HTMLSelectElement>(`#${id}`)!;
    const handler = () => { layer.setVariable(el.value); };
    el.addEventListener('change', handler);
    this.#cleanupFns.push(() => el.removeEventListener('change', handler));
  }
}

if (!customElements.get(MapControlsComponent.tagName)) {
  customElements.define(MapControlsComponent.tagName, MapControlsComponent);
}

export { MapControlsComponent };
