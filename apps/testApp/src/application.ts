import 'ol/ol.css';
import './application.css';
import { fromLonLat, transformExtent } from 'ol/proj';

import { AppMap } from '@lib/maps/map/openLayers/appMap.ts';
// import { Tree } from '@lib/components/tree/tree.ts';
import type { VectorLayerConfig } from '@lib/maps/layers/types.ts';
import { BaseComponent } from '@lib/components/base-component.ts';
import { MapPopupComponent } from './components/map-popup/map-popup.ts';
// import { TreeComponent } from '@lib/widgets/tree/tree-component.ts';
import { mountExplorerToc, mountLayerToc } from './tocs.ts';

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

  protected bindEvents(): void {
    this.#buildMap();
    this.#addLayers();
    this.#mountPopup();
    mountExplorerToc(this);
    mountLayerToc(this, this.#map);
  }

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

    this.#map.once('postrender', () => {
      this.#map.nativeMap.getView().fit(CANADA_EXTENT, { padding: [20, 20, 20, 20] });
    });
  }

  #addLayers(): void {
    this.#map.addLayer(provincesConfig as unknown as VectorLayerConfig);
    this.#map.addLayer(pointsConfig    as unknown as VectorLayerConfig);
    this.#map.addLayer(airportsConfig  as unknown as VectorLayerConfig);
  }

  #mountPopup(): void {
    const popup = document.createElement(MapPopupComponent.tagName) as MapPopupComponent;
    popup.setup(this.#map);
    this.appendChild(popup);
  }

  // #mountLayerPanel(): void {
  //   const layers = this.#map.getLayers() as VectorAppLayer[];
  //   const tree = new Tree<VectorAppLayer>();
  //   for (const layer of layers) tree.addNode(layer);
  //
  //   const panel = document.createElement(TreeComponent.tagName) as TreeComponent;
  //   panel.className = 'layer-panel';
  //   panel.setup(
  //     tree,
  //     (layer: VectorAppLayer) => this.#layerNodeHtml(layer),
  //     (layer: VectorAppLayer) => layer.id,
  //   );
  //   this.appendChild(panel);
  //
  //   panel.addEventListener('change', (e: Event) => {
  //     const target = e.target as HTMLInputElement | HTMLSelectElement;
  //     const layerId = target.dataset['layerId'];
  //     if (!layerId) return;
  //     const layer = layers.find(l => l.id === layerId);
  //     if (!layer) return;
  //     if (target instanceof HTMLInputElement) {
  //       layer.visible = target.checked;
  //     } else if (target instanceof HTMLSelectElement) {
  //       layer.setVariable(target.value);
  //     }
  //   });
  //
  //   for (const layer of layers) {
  //     layer.on('change:variable', () => panel.render());
  //     layer.on('change:visible',  () => panel.render());
  //   }
  // }


  // #layerNodeHtml(layer: VectorAppLayer): string {
  //   const { items } = layer.legend;
  //   const legendHtml = items.map(item => {
  //     const swatch = item.symbol
  //       ? `<img class="legend-icon" src="${item.symbol}" alt="">`
  //       : `<span class="legend-swatch" style="background-color:${item.color ?? 'transparent'}"></span>`;
  //     return `<div class="legend-item">${swatch}<span class="legend-item-label">${item.label}</span></div>`;
  //   }).join('');
  //
  //   return `
  //     <div class="layer-block">
  //       <div class="layer-block-title">${layer.label}</div>
  //       <div class="layer-block-row">
  //         <input type="checkbox" data-layer-id="${layer.id}" ${layer.visible ? 'checked' : ''}>
  //         <label>Visible</label>
  //         ${layer.variables.length > 0 ? `
  //           <select data-layer-id="${layer.id}" class="layer-block-select">
  //             ${layer.variables.map(v => `<option value="${v.id}"${v.id === layer.variable?.id ? ' selected' : ''}>${v.id}</option>`).join('')}
  //           </select>
  //         ` : ''}
  //       </div>
  //       ${legendHtml ? `<div class="legend-items">${legendHtml}</div>` : ''}
  //     </div>
  //   `;
  // }
}

if (!customElements.get(Application.tagName)) {
  customElements.define(Application.tagName, Application);
}

export { Application };
