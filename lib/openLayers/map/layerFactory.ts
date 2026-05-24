import OLVectorLayer from 'ol/layer/Vector.js';
import OLImageLayer from 'ol/layer/Image.js';
import OLTileLayer from 'ol/layer/Tile.js';
import VectorSource from 'ol/source/Vector.js';
import ImageWMS from 'ol/source/ImageWMS.js';
import TileArcGISRest from 'ol/source/TileArcGISRest.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import EsriJSON from 'ol/format/EsriJSON.js';
import { bbox } from 'ol/loadingstrategy.js';
import type OLBaseLayer from 'ol/layer/Base.js';

import type { AppLayer } from '../layers/baseLayer.ts';
import { VectorAppLayer } from '../layers/vectorLayer.ts';
import { ImageAppLayer } from '../layers/imageLayer.ts';
import { TileAppLayer } from '../layers/tileLayer.ts';
import type { LayerConfig, VectorLayerConfig, ImageLayerConfig, TileLayerConfig, VectorSourceConfig, WFSSourceConfig, EsriJSONSourceConfig } from '../layers/types.ts';

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
  return new OLVectorLayer({ source: createVectorSource(config.source) });
}

function createNativeImageLayer(config: ImageLayerConfig): OLImageLayer<ImageWMS> {
  return new OLImageLayer({
    source: new ImageWMS({ url: config.source.url, params: config.source.params }),
  });
}

function createNativeTileLayer(config: TileLayerConfig): OLTileLayer {
  return new OLTileLayer({ source: new TileArcGISRest({ url: config.source.url }) });
}

function createVectorSource(source: VectorSourceConfig): VectorSource {
  switch (source.type) {
    case 'geojson':  return new VectorSource({ url: source.url, format: new GeoJSON() });
    case 'esrijson': return createEsriJSONSource(source);
    case 'wfs':      return createWFSSource(source);
  }
}

function createWFSSource(source: WFSSourceConfig): VectorSource {
  return new VectorSource({
    format: new GeoJSON(),
    strategy: bbox,
    url: (extent, _resolution, projection) => {
      const params = new URLSearchParams({
        service: 'WFS',
        version: source.version ?? '2.0.0',
        request: 'GetFeature',
        typeName: source.typeName,
        outputFormat: 'application/json',
        srsname: projection.getCode(),
        bbox: `${extent.join(',')},${projection.getCode()}`,
      });
      return `${source.url}?${params}`;
    },
  });
}

function createEsriJSONSource(source: EsriJSONSourceConfig): VectorSource {
  return new VectorSource({
    format: new EsriJSON(),
    strategy: bbox,
    url: (extent) => {
      const params = new URLSearchParams({
        f: 'json',
        returnGeometry: 'true',
        spatialRel: 'esriSpatialRelIntersects',
        geometry: JSON.stringify({
          xmin: extent[0], ymin: extent[1],
          xmax: extent[2], ymax: extent[3],
          spatialReference: { wkid: 102100 },
        }),
        geometryType: 'esriGeometryEnvelope',
        inSR: '102100',
        outFields: '*',
        outSR: '102100',
      });
      return `${source.url}/query?${params}`;
    },
  });
}
