import 'ol/ol.css';
import './application.css';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, transformExtent } from 'ol/proj';

import { AppMap } from '@lib/openLayers/map/appMap.ts';
import type { VectorAppLayer } from '@lib/openLayers/layers/vectorLayer.ts';
import type { VectorLayerConfig } from '@lib/openLayers/layers/types.ts';
import { BaseComponent } from './components/base-component.ts';
import { MapControlsComponent } from './components/map-controls.ts';

import provincesConfig from '@lib/openLayers/testFiles/layers/provinces.json';
import pointsConfig from '@lib/openLayers/testFiles/layers/points.json';

const CANADA_EXTENT = transformExtent([-141.0, 41.7, -60.6, 78.1], 'EPSG:4326', 'EPSG:3857');

class Application extends BaseComponent {
  static readonly tagName = 'app-root';

  html(): string {
    return `<div class="app-map"></div>`;
  }

  initialize(): void {
    const map = this.#buildMap();
    const { provinces, points } = this.#addLayers(map);
    this.#mountControls(provinces, points);
  }

  protected bindEvents(): void {}
  protected cleanup(): void {}

  #buildMap(): AppMap {
    const appMap = new AppMap({
      target: this.querySelector<HTMLElement>('.app-map')!,
      center: fromLonLat([-96.8, 71.4]) as [number, number],
      zoom: 3,
      extent: CANADA_EXTENT,
      constrainOnlyCenter: true,
      minZoom: 3,
    });

    appMap.map.addLayer(new TileLayer({ source: new OSM(), zIndex: 0 }));
    appMap.map.once('postrender', () => {
      appMap.map.getView().fit(CANADA_EXTENT, { padding: [20, 20, 20, 20] });
    });

    return appMap;
  }

  #addLayers(map: AppMap): { provinces: VectorAppLayer; points: VectorAppLayer } {
    return {
      provinces: map.addLayer(provincesConfig as unknown as VectorLayerConfig) as VectorAppLayer,
      points:    map.addLayer(pointsConfig    as unknown as VectorLayerConfig) as VectorAppLayer,
    };
  }

  #mountControls(provinces: VectorAppLayer, points: VectorAppLayer): void {
    const controls = document.createElement(MapControlsComponent.tagName) as MapControlsComponent;
    controls.setup(provinces, points);
    this.appendChild(controls);
  }
}

if (!customElements.get(Application.tagName)) {
  customElements.define(Application.tagName, Application);
}

export { Application };
