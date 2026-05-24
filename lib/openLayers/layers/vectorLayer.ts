import { extractFillColor } from '../openLayers.ts';
import { BaseAppLayer, type BaseLayerEvents, type NativeLayer } from './baseLayer.ts';
import type { VectorLayerConfig, FieldConfig, VariableConfig, Legend, LegendItem, RendererRule } from './types.ts';

interface NativeVectorLayer extends NativeLayer {
  setStyle(style: unknown): void;
}

export interface VectorLayerEvents extends BaseLayerEvents {
  'change:variable': { variable: VariableConfig };
}

/**
 * Vector layer that displays GeoJSON features with style variations.
 * Supports multiple rendering "variables" that can be switched dynamically.
 */
export class VectorAppLayer extends BaseAppLayer<VectorLayerConfig, NativeVectorLayer, VectorLayerEvents> {
  #variable: VariableConfig;

  static override EVENTS = {
    ...BaseAppLayer.EVENTS,
    CHANGE_VARIABLE: 'change:variable',
  } as const;

  constructor(config: VectorLayerConfig, nativeLayer: NativeVectorLayer) {
    super(config, nativeLayer);
    this.#variable = VectorAppLayer.getVariable(config, config.default_variable);
  }

  get fields(): FieldConfig[] {
    return this.config.fields;
  }

  get legend(): Legend {
    const defaultSubLabel = this.config.fields.find(f => f.id === this.#variable.id)?.label ?? '';
    return {
      label: this.config.legend?.label ?? this.config.label,
      subLabel: this.config.legend?.subLabel ?? defaultSubLabel,
      items: getLegendItems(this.#variable),
    };
  }

  get variables(): VariableConfig[] {
    return this.config.variables;
  }

  get currentVariableId(): string {
    return this.#variable.id;
  }

  get variable(): VariableConfig {
    return this.#variable;
  }

  /**
   * Sets the active style variable by ID, updates the layer styling, and emits 'change:variable'.
   * Throws if the variable ID is not found.
   */
  set variable(variableId: string) {
    const variable = VectorAppLayer.getVariable(this.config, variableId);
    this.nativeLayer.setStyle(variable.renderer);
    this.#variable = variable;
    this.emit('change:variable', { variable });
  }

  private static getVariable(config: VectorLayerConfig, id: string): VariableConfig {
    const variable = config.variables.find(v => v.id === id);
    if (!variable) throw new Error(`Variable "${id}" not found in layer "${config.id}"`);
    return variable;
  }
}

function getLabelFromFilter(filter: unknown): string {
  if (Array.isArray(filter) && filter.length >= 3) return String(filter[filter.length - 1]);
  return '';
}

function getLegendItems(variable: VariableConfig): LegendItem[] {
  if (variable.legend?.items?.length) return variable.legend.items;
  return (variable.renderer as RendererRule[]).map(rule => ({
    label: rule.label ?? getLabelFromFilter(rule.filter),
    color: rule.style ? extractFillColor(rule.style) : undefined,
    style: rule.style,
  }));
}
