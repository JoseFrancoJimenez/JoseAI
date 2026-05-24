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

/**
 * Configuration for a vector layer
 */
export interface VectorLayerConfig extends BaseLayerConfig {
  type: 'vector';
  source_url: string;
  fields: FieldConfig[];
  default_variable: string;
  variables: VariableConfig[];
}

/**
 * Parameters for a WMS (Web Map Service) request
 */
export interface WmsParams {
  LAYERS: string;
  STYLES?: string;
  FORMAT?: string;
  TRANSPARENT?: boolean;
}

/**
 * Configuration for an image layer backed by WMS
 */
export interface ImageLayerConfig extends BaseLayerConfig {
  type: 'image';
  source_url: string;
  wms_params: WmsParams;
}

/**
 * A rule for rendering features in a layer based on attribute filters, 
 * with an optional label and style overrides.
 * */
export type RendererRule = {
  label?: string;
  filter?: unknown[];
  style?: Record<string, unknown>;
};

/**
 * Configuration for a tile layer backed by an ArcGIS MapServer REST service
 */
export interface TileLayerConfig extends BaseLayerConfig {
  type: 'tile';
  source_url: string;
}

/**
 * Union type for all layer configurations
 */
export type LayerConfig = VectorLayerConfig | ImageLayerConfig | TileLayerConfig;
