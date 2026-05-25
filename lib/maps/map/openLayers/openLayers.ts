import OLMap from 'ol/Map.js';
import View from 'ol/View.js';
import type OLBaseLayer from 'ol/layer/Base.js';
import type { Extent } from 'ol/extent.js';

export type { OLMap, OLBaseLayer };

/** Union of valid OL Map event type strings. Extend as new event types are needed. */
export type OLMapEventType =
  | 'click' | 'dblclick' | 'singleclick' | 'pointerdrag' | 'pointermove'
  | 'movestart' | 'moveend'
  | 'precompose' | 'postcompose' | 'prerender' | 'postrender' | 'rendercomplete'
  | 'change' | 'error' | 'propertychange';

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

/**
 * Converts our renderer array to an OL FlatStyleLike value.
 *
 * OL supports two array forms:
 *  - FlatStyle[]  — plain style objects applied to every feature
 *  - Rule[]       — { filter?, else?, style } objects for conditional rendering
 *
 * filter/else/style are only honoured on Rule objects, not on FlatStyle objects.
 * So when any renderer item carries filter, else, or a nested style, we emit
 * Rule[] so OL evaluates conditions correctly.
 */
export function toOLStyle(renderer: unknown[]): unknown[] {
  const needsRules = renderer.some(r =>
    typeof r === 'object' && r !== null &&
    ('filter' in (r as object) || 'style' in (r as object) || 'else' in (r as object))
  );

  if (!needsRules) return renderer;

  return renderer.map(rule => {
    if (typeof rule !== 'object' || rule === null) return rule;
    const r = rule as Record<string, unknown>;

    if ('style' in r) {
      const { filter, style, else: isElse } = r as { filter?: unknown; style: unknown; else?: boolean };
      const out: Record<string, unknown> = { style };
      if (filter !== undefined) out['filter'] = filter;
      if (isElse) out['else'] = true;
      return out;
    }

    const { filter, ...styleProps } = r as { filter?: unknown; [k: string]: unknown };
    return filter !== undefined ? { filter, style: styleProps } : { style: r };
  });
}
