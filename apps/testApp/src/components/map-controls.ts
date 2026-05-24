import './map-controls.css';
import type { VectorAppLayer } from '@lib/openLayers/layers/vectorLayer.ts';
import { BaseComponent } from './base-component.ts';

class MapControlsComponent extends BaseComponent {
  static readonly tagName = 'map-controls';

  #provinces: VectorAppLayer | null = null;
  #points: VectorAppLayer | null = null;
  #airports: VectorAppLayer | null = null;
  #cleanupFns: (() => void)[] = [];

  setup(provinces: VectorAppLayer, points: VectorAppLayer, airports: VectorAppLayer): void {
    this.#provinces = provinces;
    this.#points = points;
    this.#airports = airports;
  }

  html(): string {
    if (!this.#provinces || !this.#points || !this.#airports) return '';
    return `
      <div class="map-controls-panel">
        ${this.#rowHtml('Provinces',          this.#checkboxHtml('provinces-visible', this.#provinces.visible))}
        ${this.#rowHtml('Provinces variable', this.#selectHtml('provinces-variable',  this.#provinces))}
        ${this.#rowHtml('Points',             this.#checkboxHtml('points-visible',    this.#points.visible))}
        ${this.#rowHtml('Points variable',    this.#selectHtml('points-variable',     this.#points))}
        ${this.#rowHtml('Airports',           this.#checkboxHtml('airports-visible',  this.#airports.visible))}
        ${this.#rowHtml('Airports variable',  this.#selectHtml('airports-variable',   this.#airports))}
      </div>
    `;
  }

  protected bindEvents(): void {
    this.#wireCheckbox('provinces-visible', this.#provinces!);
    this.#wireSelect('provinces-variable',  this.#provinces!);
    this.#wireCheckbox('points-visible',    this.#points!);
    this.#wireSelect('points-variable',     this.#points!);
    this.#wireCheckbox('airports-visible',  this.#airports!);
    this.#wireSelect('airports-variable',   this.#airports!);
  }

  protected cleanup(): void {
    this.#cleanupFns.forEach(fn => fn());
    this.#cleanupFns = [];
  }

  #rowHtml(label: string, controlHtml: string): string {
    return `
      <div class="map-controls-row">
        <label>${label}</label>
        ${controlHtml}
      </div>
    `;
  }

  #checkboxHtml(id: string, checked: boolean): string {
    return `<input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>`;
  }

  #selectHtml(id: string, layer: VectorAppLayer): string {
    const options = layer.variables
      .map(v => `<option value="${v.id}"${v.id === layer.variable.id ? ' selected' : ''}>${v.id}</option>`)
      .join('');
    return `<select id="${id}">${options}</select>`;
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
