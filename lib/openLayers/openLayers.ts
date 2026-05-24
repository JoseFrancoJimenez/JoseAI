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

/**
 * Converts our renderer array to OL flat style format.
 * RendererRule objects (with nested `style`, `label`, `else`) are flattened;
 * plain flat style objects pass through unchanged.
 */
export function toOLStyle(renderer: unknown[]): unknown[] {
  return renderer.map(rule => {
    if (typeof rule !== 'object' || rule === null || !('style' in (rule as object))) return rule;
    const { filter, style } = rule as { filter?: unknown; style: Record<string, unknown> };
    return filter !== undefined ? { filter, ...style } : { ...style };
  });
}
