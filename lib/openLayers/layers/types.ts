/**
 * Configuration for a field in a layer's dataset
 */
export interface FieldConfig {
  id: string;
  label: string;
}

/**
 * An entry in a layer's legend
 */
export interface LegendItem {
  label: string;
  color?: string;
  style?: Record<string, unknown>;
}

/**
 * The full legend object returned by a layer's legend getter.
 * Use Partial<Legend> in config when some fields should fall back to layer defaults.
 */
export interface Legend {
  label: string;
  subLabel: string;
  items: LegendItem[];
}

/**
 * Configuration for a variable (style variant) within a layer
 */
export interface VariableConfig {
  id: string;
  renderer: unknown[];
  legend?: Partial<Legend>;
}

/**
 * Base configuration shared by all layer types
 */
export interface BaseLayerConfig {
  id: string;
  label: string;
  visible?: boolean;
  opacity?: number;
  legend?: Partial<Legend>;
}

// ── Vector source configs ────────────────────────────────────────────────────

export interface GeoJSONSourceConfig {
  type: 'geojson';
  url: string;
}

export interface EsriJSONSourceConfig {
  type: 'esrijson';
  url: string;
}

export interface WFSSourceConfig {
  type: 'wfs';
  url: string;
  typeName: string;
  version?: string;
}

export type VectorSourceConfig = GeoJSONSourceConfig | EsriJSONSourceConfig | WFSSourceConfig;

// ── Tile source configs ──────────────────────────────────────────────────────

export interface ArcGISTileSourceConfig {
  type: 'arcgis_tile';
  url: string;
}

export type TileSourceConfig = ArcGISTileSourceConfig;

// ── Image source configs ─────────────────────────────────────────────────────

export interface WmsParams {
  LAYERS: string;
  STYLES?: string;
  FORMAT?: string;
  TRANSPARENT?: boolean;
}

export interface WMSSourceConfig {
  type: 'wms';
  url: string;
  params: WmsParams;
}

export type ImageSourceConfig = WMSSourceConfig;

// ── Layer configs ────────────────────────────────────────────────────────────

export interface VectorLayerConfig extends BaseLayerConfig {
  type: 'vector';
  source: VectorSourceConfig;
  fields: FieldConfig[];
  default_variable: string;
  variables: VariableConfig[];
}

export interface ImageLayerConfig extends BaseLayerConfig {
  type: 'image';
  source: ImageSourceConfig;
}

export type RendererRule = {
  label?: string;
  filter?: unknown[];
  style?: Record<string, unknown>;
};

export interface TileLayerConfig extends BaseLayerConfig {
  type: 'tile';
  source: TileSourceConfig;
}

export type LayerConfig = VectorLayerConfig | ImageLayerConfig | TileLayerConfig;
