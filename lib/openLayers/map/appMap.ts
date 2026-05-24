import type { Subscription } from '../../components/evented.ts';
import { createMap, toOLStyle, type MapConfig, type OLMap, type OLBaseLayer } from '../openLayers.ts';
import { createAppLayer, createNativeLayer } from './layerFactory.ts';
import type OLVectorLayer from 'ol/layer/Vector.js';
import type { StyleLike } from 'ol/style/Style.js';
import type { FeatureLike } from 'ol/Feature.js';
import type { AppLayer } from '../layers/baseLayer.ts';
import type { VectorAppLayer } from '../layers/vectorLayer.ts';
import type { LayerConfig } from '../layers/types.ts';

export interface HitTestResult {
  layer: AppLayer;
  features: FeatureLike[];
}

interface LayerEntry {
  layer: AppLayer;
  native: OLBaseLayer;
  subscriptions: Subscription[];
}

export class AppMap {
  readonly #map: OLMap;
  readonly #layers = new Map<string, LayerEntry>();

  constructor(config: MapConfig) {
    this.#map = createMap(config);
  }

  get map(): OLMap { return this.#map; }

  addLayer(config: LayerConfig): AppLayer {
    if (this.#layers.has(config.id)) {
      console.warn(`Layer "${config.id}" is already on the map.`);
      return this.#layers.get(config.id)!.layer;
    }

    const native = createNativeLayer(config);
    const layer = createAppLayer(config);

    native.setVisible(config.visible ?? true);
    native.setOpacity(config.opacity ?? 1);

    const subscriptions: Subscription[] = [
      layer.on('change:visible', ({ visible }) => native.setVisible(visible)),
      layer.on('change:opacity', ({ opacity }) => native.setOpacity(opacity)),
    ];

    if (config.type === 'vector') {
      const vLayer = layer as VectorAppLayer;
      const nativeVector = native as OLVectorLayer;
      nativeVector.setStyle(toOLStyle(vLayer.variable.renderer) as unknown as StyleLike);
      subscriptions.push(
        vLayer.on('change:variable', ({ variable }) =>
          nativeVector.setStyle(toOLStyle(variable.renderer) as unknown as StyleLike)
        )
      );
    }

    this.#map.addLayer(native);
    this.#layers.set(config.id, { layer, native, subscriptions });
    return layer;
  }

  removeLayer(id: string): void {
    const entry = this.#layers.get(id);
    if (!entry) return;
    entry.subscriptions.forEach(s => s.remove());
    this.#map.removeLayer(entry.native);
    this.#layers.delete(id);
  }

  getLayer(id: string): AppLayer | undefined {
    return this.#layers.get(id)?.layer;
  }

  getLayers(): AppLayer[] {
    return [...this.#layers.values()].map(e => e.layer);
  }

  getNativeLayer(id: string): OLBaseLayer | undefined {
    return this.#layers.get(id)?.native;
  }

  hitTest(pixel: [number, number]): HitTestResult[] {
    const results: HitTestResult[] = [];
    const nativeToApp = new Map<OLBaseLayer, AppLayer>();
    for (const entry of this.#layers.values()) nativeToApp.set(entry.native, entry.layer);

    this.#map.forEachFeatureAtPixel(pixel, (feature, layer) => {
      if (!layer) return;
      const appLayer = nativeToApp.get(layer as OLBaseLayer);
      if (!appLayer) return;
      let result = results.find(r => r.layer === appLayer);
      if (!result) { result = { layer: appLayer, features: [] }; results.push(result); }
      result.features.push(feature as FeatureLike);
    });

    return results;
  }
}
