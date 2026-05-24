import OLVectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import type { StyleLike } from 'ol/style/Style.js';
import { extractFillColor } from '../openLayers.ts';
import type { VectorLayerConfig, FieldConfig, VariableConfig, Legend, LegendItem, RendererRule } from './types.ts';

export class VectorAppLayer extends OLVectorLayer {
  readonly #config: VectorLayerConfig;
  #variable: VariableConfig;

  constructor(config: VectorLayerConfig) {
    const defaultVariable = config.variables.find(v => v.id === config.default_variable);
    const source = new VectorSource({ url: config.source_url, format: new GeoJSON() });
    super({
      source,
      style: defaultVariable?.renderer as unknown as StyleLike,
      visible: config.visible ?? true,
      opacity: config.opacity ?? 1,
    });
    this.#config = config;
    this.#variable = VectorAppLayer.getVariable(config, config.default_variable);
  }

  get id(): string {
    return this.#config.id;
  }

  get label(): string {
    return this.#config.label;
  }

  get visible(): boolean {
    return this.getVisible();
  }

  set visible(value: boolean) {
    this.setVisible(value);
  }

  get opacity(): number {
    return this.getOpacity();
  }

  set opacity(value: number) {
    this.setOpacity(value);
  }

  get fields(): FieldConfig[] {
    return this.#config.fields;
  }

  get legend(): Legend {
    const defaultSubLabel = this.#config.fields.find(f => f.id === this.#variable.id)?.label ?? '';
    return {
      label: this.#config.legend?.label ?? this.#config.label,
      subLabel: this.#config.legend?.subLabel ?? defaultSubLabel,
      items: getLegendItems(this.#variable),
    };
  }

  get variables(): VariableConfig[] {
    return this.#config.variables;
  }

  get currentVariableId(): string {
    return this.#variable.id;
  }

  get variable(): VariableConfig {
    return this.#variable;
  }

  set variable(variableId: string) {
    const variable = VectorAppLayer.getVariable(this.#config, variableId);
    this.setStyle(variable.renderer as unknown as StyleLike);
    this.#variable = variable;
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
