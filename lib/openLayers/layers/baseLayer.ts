import Evented from '../evented.ts';
import type { BaseLayerConfig, FieldConfig, Legend } from './types.ts';

export interface NativeLayer {
  getVisible(): boolean;
  setVisible(visible: boolean): void;
  getOpacity(): number;
  setOpacity(opacity: number): void;
}

export interface BaseLayerEvents {
  'change:visible': { visible: boolean };
  'change:opacity': { opacity: number };
}

/**
 * Abstract base class for all application layers.
 *
 * Extend with a TEvents map to add typed events alongside the built-in
 * visibility and opacity change events:
 *
 * ```ts
 * interface MyLayerEvents extends BaseLayerEvents {
 *   'change:style': { style: unknown };
 * }
 * class MyLayer extends BaseAppLayer<MyConfig, MyNativeLayer, MyLayerEvents> { ... }
 * ```
 */
export abstract class BaseAppLayer<
  TConfig extends BaseLayerConfig = BaseLayerConfig,
  TNativeLayer extends NativeLayer = NativeLayer,
  TEvents extends BaseLayerEvents = BaseLayerEvents,
> extends Evented<TEvents> {
  protected readonly config: TConfig;
  readonly #nativeLayer: TNativeLayer;

  static override EVENTS = {
    CHANGE_VISIBLE: 'change:visible',
    CHANGE_OPACITY: 'change:opacity',
  } as const;

  constructor(config: TConfig, nativeLayer: TNativeLayer) {
    super();
    this.config = config;
    this.#nativeLayer = nativeLayer;
  }

  get nativeLayer(): TNativeLayer {
    return this.#nativeLayer;
  }

  get id(): string {
    return this.config.id;
  }

  get label(): string {
    return this.config.label;
  }

  get visible(): boolean {
    return this.#nativeLayer.getVisible();
  }

  set visible(value: boolean) {
    this.#nativeLayer.setVisible(value);
    // Cast is safe: TEvents extends BaseLayerEvents guarantees this key exists with this shape.
    this.emit('change:visible', { visible: value } as TEvents['change:visible']);
  }

  get opacity(): number {
    return this.#nativeLayer.getOpacity();
  }

  set opacity(value: number) {
    this.#nativeLayer.setOpacity(value);
    this.emit('change:opacity', { opacity: value } as TEvents['change:opacity']);
  }

  get fields(): FieldConfig[] {
    return [];
  }

  get legend(): Legend {
    return {
      label: this.config.legend?.label ?? this.config.label,
      subLabel: this.config.legend?.subLabel ?? '',
      items: this.config.legend?.items ?? [],
    };
  }
}
