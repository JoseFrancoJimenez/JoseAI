import { BaseAppLayer, type NativeLayer } from './baseLayer.ts';
import type { ImageLayerConfig } from './types.ts';

/**
 * Image layer that displays raster data from a WMS service.
 */
export class ImageAppLayer extends BaseAppLayer<ImageLayerConfig> {
  constructor(config: ImageLayerConfig, nativeLayer: NativeLayer) {
    super(config, nativeLayer);
  }
}
