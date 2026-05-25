import 'ol/ol.css';
import './application.css';
import { fromLonLat, transformExtent } from 'ol/proj';

import { AppMap } from '@lib/maps/map/openLayers/appMap.ts';
import type { VectorAppLayer } from '@lib/maps/layers/vectorLayer.ts';
import type { VectorLayerConfig } from '@lib/maps/layers/types.ts';
import { BaseComponent } from './components/base-component.ts';
import { MapControlsComponent } from './components/map-controls.ts';
import { MapPopupComponent } from './components/map-popup.ts';

import provincesConfig from './testData/layers/provinces.json';
import pointsConfig from './testData/layers/points.json';
import airportsConfig from './testData/layers/airports.json';

const CANADA_EXTENT = transformExtent([-141.0, 41.7, -60.6, 78.1], 'EPSG:4326', 'EPSG:3857');

class Application extends BaseComponent {
  static readonly tagName = 'app-root';

  #map!: AppMap;

  html(): string {
    return `<div class="app-map"></div>`;
  }

  initialize(): void {
    this.#buildMap();
    this.#addLayers();
    this.#mountControls();
    this.#mountPopup();
  }

  protected bindEvents(): void {}
  protected cleanup(): void {}

  #buildMap(): void {
    this.#map = new AppMap({
      target: this.querySelector<HTMLElement>('.app-map')!,
      center: fromLonLat([-96.8, 71.4]) as [number, number],
      zoom: 3,
      extent: CANADA_EXTENT,
      constrainOnlyCenter: true,
      minZoom: 3,
    });

    this.#map.nativeMap.once('postrender', () => {
      this.#map.nativeMap.getView().fit(CANADA_EXTENT, { padding: [20, 20, 20, 20] });
    });
  }

  #addLayers(): void {
    this.#map.addLayer(provincesConfig as unknown as VectorLayerConfig);
    this.#map.addLayer(pointsConfig    as unknown as VectorLayerConfig);
    this.#map.addLayer(airportsConfig  as unknown as VectorLayerConfig);
  }

  #mountControls(): void {
    const controls = document.createElement(MapControlsComponent.tagName) as MapControlsComponent;
    controls.setup(this.#map.getLayers() as VectorAppLayer[]);
    this.appendChild(controls);
  }

  #mountPopup(): void {
    const popup = document.createElement(MapPopupComponent.tagName) as MapPopupComponent;
    popup.setup(this.#map);
    this.appendChild(popup);
  }
}

if (!customElements.get(Application.tagName)) {
  customElements.define(Application.tagName, Application);
}

export { Application };
