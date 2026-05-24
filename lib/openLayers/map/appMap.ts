import type { Subscription } from '../../components/evented.ts';
import { createMap, type MapConfig, type OLMap, type OLBaseLayer } from '../openLayers.ts';
import { createAppLayer, createNativeLayer } from './layerFactory.ts';
import type OLVectorLayer from 'ol/layer/Vector.js';
import type { StyleLike } from 'ol/style/Style.js';
import type { AppLayer } from '../layers/baseLayer.ts';
import type { VectorAppLayer } from '../layers/vectorLayer.ts';
import type { LayerConfig } from '../layers/types.ts';

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
      nativeVector.setStyle(vLayer.variable.renderer[0] as unknown as StyleLike);
      subscriptions.push(
        vLayer.on('change:variable', ({ variable }) =>
          nativeVector.setStyle(variable.renderer[0] as unknown as StyleLike)
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
}
