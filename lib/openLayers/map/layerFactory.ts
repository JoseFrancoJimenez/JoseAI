import OLVectorLayer from 'ol/layer/Vector.js';
import OLImageLayer from 'ol/layer/Image.js';
import OLTileLayer from 'ol/layer/Tile.js';
import VectorSource from 'ol/source/Vector.js';
import ImageWMS from 'ol/source/ImageWMS.js';
import TileArcGISRest from 'ol/source/TileArcGISRest.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import type OLBaseLayer from 'ol/layer/Base.js';
import type { StyleLike } from 'ol/style/Style.js';

import type { AppLayer } from '../layers/baseLayer.ts';
import { VectorAppLayer } from '../layers/vectorLayer.ts';
import { ImageAppLayer } from '../layers/imageLayer.ts';
import { TileAppLayer } from '../layers/tileLayer.ts';
import type { LayerConfig, VectorLayerConfig, ImageLayerConfig, TileLayerConfig } from '../layers/types.ts';

/** Minimal interface for native vector layers — used by AppMap to sync style changes. */
export interface INativeVectorLayer {
  setStyle(style: unknown): void;
}

export function createAppLayer(config: LayerConfig): AppLayer {
  switch (config.type) {
    case 'vector': return new VectorAppLayer(config);
    case 'image':  return new ImageAppLayer(config);
    case 'tile':   return new TileAppLayer(config);
  }
}

export function createNativeLayer(config: LayerConfig): OLBaseLayer {
  switch (config.type) {
    case 'vector': return createNativeVectorLayer(config);
    case 'image':  return createNativeImageLayer(config);
    case 'tile':   return createNativeTileLayer(config);
  }
}

function createNativeVectorLayer(config: VectorLayerConfig): OLVectorLayer {
  const defaultVariable = config.variables.find(v => v.id === config.default_variable);
  return new OLVectorLayer({
    source: new VectorSource({ url: config.source_url, format: new GeoJSON() }),
    style: defaultVariable?.renderer as unknown as StyleLike,
    visible: config.visible ?? true,
    opacity: config.opacity ?? 1,
  });
}

function createNativeImageLayer(config: ImageLayerConfig): OLImageLayer {
  return new OLImageLayer({
    source: new ImageWMS({ url: config.source_url, params: config.wms_params }),
    visible: config.visible ?? true,
    opacity: config.opacity ?? 1,
  });
}

function createNativeTileLayer(config: TileLayerConfig): OLTileLayer {
  return new OLTileLayer({
    source: new TileArcGISRest({ url: config.source_url }),
    visible: config.visible ?? true,
    opacity: config.opacity ?? 1,
  });
}
