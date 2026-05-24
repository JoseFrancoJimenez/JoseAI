import { BaseAppLayer, type NativeLayer } from './baseLayer.ts';
import type { TileLayerConfig } from './types.ts';

/**
 * Tile layer that displays raster data from an ArcGIS MapServer REST service.
 */
export class TileAppLayer extends BaseAppLayer<TileLayerConfig> {
  constructor(config: TileLayerConfig, nativeLayer: NativeLayer) {
    super(config, nativeLayer);
  }
}
