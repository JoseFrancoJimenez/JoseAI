import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import { unByKey } from 'ol/Observable.js';
import type { EventsKey } from 'ol/events.js';
import type OLVectorLayer from 'ol/layer/Vector.js';
import type { StyleLike } from 'ol/style/Style.js';
import type { FeatureLike } from 'ol/Feature.js';
import Evented from '../../../components/evented.ts';
import type { Subscription } from '../../../components/evented.ts';
import { createMap, toOLStyle, type MapConfig, type OLMap, type OLBaseLayer } from './openLayers.ts';
import { createAppLayer, createNativeLayer } from './layerFactory.ts';
import type { AppLayer } from '../../layers/baseLayer.ts';
import type { VectorAppLayer } from '../../layers/vectorLayer.ts';
import type { LayerConfig } from '../../layers/types.ts';

export interface AppMapEvents {
  'layer:added':   { layer: AppLayer };
  'layer:removed': { layer: AppLayer };
}

export interface HitTestResult {
  layer: AppLayer;
  features: FeatureLike[];
}

interface LayerEntry {
  layer: AppLayer;
  native: OLBaseLayer;
  subscriptions: Subscription[];
}

/** Manages the OpenLayers map instance, its AppLayer registry, and emits layer lifecycle events. */
class AppMap extends Evented<AppMapEvents> {
  static readonly #OWN_EVENTS = new Set<string>(['layer:added', 'layer:removed']);

  readonly #nativeMap: OLMap;
  readonly #layers = new Map<string, LayerEntry>();
  #baseLayer: OLBaseLayer;

  constructor(config: MapConfig) {
    super();
    this.#nativeMap = createMap(config);
    this.#baseLayer = new TileLayer({ source: new OSM(), zIndex: 0 });
    this.#nativeMap.addLayer(this.#baseLayer);
  }

  /** The underlying OL map instance. Use for OL-specific operations (overlays, view access, etc.). */
  get nativeMap(): OLMap { return this.#nativeMap; }

  on<K extends keyof AppMapEvents & string>(event: K, handler: (payload: AppMapEvents[K]) => void): Subscription;
  on(event: string, handler: (payload: any) => void): Subscription;
  on(event: string, handler: (payload: any) => void): Subscription {
    if (AppMap.#OWN_EVENTS.has(event)) return super.on(event as keyof AppMapEvents & string, handler);
    const key = this.#nativeMap.on(event as any, handler) as EventsKey;
    return { remove: () => unByKey(key) };
  }

  once<K extends keyof AppMapEvents & string>(event: K, handler: (payload: AppMapEvents[K]) => void): Subscription;
  once(event: string, handler: (payload: any) => void): Subscription;
  once(event: string, handler: (payload: any) => void): Subscription {
    if (AppMap.#OWN_EVENTS.has(event)) return super.once(event as keyof AppMapEvents & string, handler);
    const key = this.#nativeMap.once(event as any, handler) as EventsKey;
    return { remove: () => unByKey(key) };
  }

  setBaseLayer(layer: OLBaseLayer): void {
    this.#nativeMap.removeLayer(this.#baseLayer);
    this.#baseLayer = layer;
    this.#nativeMap.getLayers().insertAt(0, layer);
  }

  addLayer(config: LayerConfig): AppLayer {
    if (this.#layers.has(config.id)) {
      throw new Error(`Layer "${config.id}" is already on the map.`);
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

    this.#nativeMap.addLayer(native);
    this.#layers.set(config.id, { layer, native, subscriptions });
    this.emit('layer:added', { layer });
    return layer;
  }

  removeLayer(id: string): void {
    const entry = this.#layers.get(id);
    if (!entry) return;
    entry.subscriptions.forEach(s => s.remove());
    this.#nativeMap.removeLayer(entry.native);
    this.#layers.delete(id);
    this.emit('layer:removed', { layer: entry.layer });
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

    this.#nativeMap.forEachFeatureAtPixel(pixel, (feature, layer) => {
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

export { AppMap };
