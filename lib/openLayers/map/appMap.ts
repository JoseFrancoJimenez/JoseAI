import { createMap, type MapConfig, type OLBaseLayer } from './openLayers.ts';
import type { BaseAppLayer } from './layers/baseLayer.ts';

/**
 * Manages the map instance and its layers.
 */
export class AppMap {
  readonly #map: ReturnType<typeof createMap>;
  readonly #layers = new Map<string, BaseAppLayer>();

  /**
   * Creates a new map manager with the given configuration
   */
  constructor(config: MapConfig) {
    this.#map = createMap(config);
  }

  /**
   * Gets the underlying OpenLayers map instance
   */
  get map(): ReturnType<typeof createMap> {
    return this.#map;
  }

  /**
   * Adds a layer to the map.
   */
  addLayer(layer: BaseAppLayer): void {
    if (this.#layers.has(layer.id)) {
      console.warn(`Layer "${layer.id}" is already on the map.`);
      return;
    }
    this.#map.addLayer(layer.nativeLayer as OLBaseLayer);
    this.#layers.set(layer.id, layer);
  }

  /**
   * Removes a layer from the map.
   */
  removeLayer(layer: BaseAppLayer): void {
    if (!this.#layers.has(layer.id)) {
      console.warn(`Layer "${layer.id}" not found.`);
      return;
    }
    this.#map.removeLayer(layer.nativeLayer as OLBaseLayer);
    this.#layers.delete(layer.id);
  }

  /**
   * Gets a layer by ID, or undefined if not found
   */
  getLayer(id: string): BaseAppLayer | undefined {
    return this.#layers.get(id);
  }

  /**
   * Gets all layers currently on the map
   */
  getLayers(): BaseAppLayer[] {
    return [...this.#layers.values()];
  }

  /**
   * Finds an application layer by its underlying native layer instance,
   * or undefined if not found
   */
  getLayerByNativeLayer(nativeLayer: OLBaseLayer): BaseAppLayer | undefined {
    return [...this.#layers.values()].find(l => l.nativeLayer === nativeLayer);
  }
}
