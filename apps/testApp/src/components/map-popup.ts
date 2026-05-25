import './map-popup.css';
import Overlay from 'ol/Overlay.js';
import type { Subscription } from '@lib/components/evented.ts';
import type { AppMap, HitTestResult } from '@lib/maps/map/openLayers/appMap.ts';
import { BaseComponent } from './base-component.ts';

class MapPopupComponent extends BaseComponent {
  static readonly tagName = 'map-popup';

  #appMap: AppMap | null = null;
  #overlay: Overlay | null = null;
  #clickSub: Subscription | null = null;
  readonly #el: HTMLElement;

  constructor() {
    super();
    this.#el = document.createElement('div');
    this.#el.className = 'popup';
    this.#el.hidden = true;
    this.#el.innerHTML = `
      <button class="popup-close" type="button">&#x2715;</button>
      <div class="popup-body"></div>
    `;
  }

  setup(appMap: AppMap): void {
    this.#appMap = appMap;
  }

  html(): string { return ''; }

  protected bindEvents(): void {
    if (!this.#appMap) return;

    this.#overlay = new Overlay({
      element: this.#el,
      positioning: 'bottom-center',
      offset: [0, -8],
      stopEvent: true,
    });
    this.#appMap.nativeMap.addOverlay(this.#overlay);

    this.#clickSub = this.#appMap.on('click', (e) => {
      const results = this.#appMap!.hitTest(e.pixel as [number, number]);
      results.length ? this.#show(results, e.coordinate as [number, number]) : this.#hide();
    });

    this.#el.querySelector('.popup-close')!.addEventListener('click', () => this.#hide());
  }

  protected cleanup(): void {
    if (this.#clickSub) {
      this.#clickSub.remove();
      this.#clickSub = null;
    }
    if (this.#overlay && this.#appMap) {
      this.#appMap.nativeMap.removeOverlay(this.#overlay);
      this.#overlay = null;
    }
  }

  #show(results: HitTestResult[], coordinate: [number, number]): void {
    this.#el.querySelector('.popup-body')!.innerHTML = results
      .map(({ layer, features }) => `
        <div class="popup-layer-block">
          <div class="popup-layer-name">${layer.label}</div>
          ${features.map(f => this.#featureHtml(f.getProperties())).join('')}
        </div>
      `)
      .join('');

    this.#el.hidden = false;
    this.#overlay!.setPosition(coordinate);
  }

  #hide(): void {
    this.#el.hidden = true;
    this.#overlay?.setPosition(undefined);
  }

  #featureHtml(props: Record<string, unknown>): string {
    const entries = Object.entries(props).filter(([k]) => k !== 'geometry');
    return `
      <div class="popup-feature">
        ${entries.map(([k, v]) => `
          <div class="popup-field">
            <span class="popup-field-key">${k}</span>
            <span class="popup-field-val">${v ?? '—'}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
}

if (!customElements.get(MapPopupComponent.tagName)) {
  customElements.define(MapPopupComponent.tagName, MapPopupComponent);
}

export { MapPopupComponent };
