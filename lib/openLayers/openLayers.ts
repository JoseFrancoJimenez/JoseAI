import OLMap from 'ol/Map.js';
import View from 'ol/View.js';
import type OLBaseLayer from 'ol/layer/Base.js';
import type { Extent } from 'ol/extent.js';

export type { OLMap, OLBaseLayer };

export interface MapConfig {
  target: string | HTMLElement;
  center: [number, number];
  zoom: number;
  projection?: string;
  extent?: Extent;
  constrainOnlyCenter?: boolean;
  minZoom?: number;
  maxZoom?: number;
}

export function createMap(config: MapConfig): OLMap {
  return new OLMap({
    target: config.target,
    view: new View({
      projection: config.projection ?? 'EPSG:3857',
      center: config.center,
      zoom: config.zoom,
      extent: config.extent,
      constrainOnlyCenter: config.constrainOnlyCenter,
      minZoom: config.minZoom,
      maxZoom: config.maxZoom,
    }),
  });
}

export function extractFillColor(style: Record<string, unknown>): string | undefined {
  const color = style['circle-fill-color'] ?? style['fill-color'];
  return typeof color === 'string' ? color : undefined;
}
