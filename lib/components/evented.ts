/** Returned by `on()`. Call `remove()` to unsubscribe without holding a handler reference. */
export interface Subscription {
  remove(): void;
}

/** Contract for any object that can emit typed events. Use this when composing instead of extending. */
export interface IEvented<TEvents extends object = Record<string, object>> {
  on<K extends keyof TEvents & string>(event: K, handler: (payload: TEvents[K]) => void): Subscription;
  off<K extends keyof TEvents & string>(event: K, handler: (payload: TEvents[K]) => void): void;
  emit<K extends keyof TEvents & string>(event: K, data: TEvents[K]): void;
}

/**
 * Generic event emitter. Subclasses declare an event map for fully typed `on`/`off`/`emit`.
 *
 * ```ts
 * interface MyEvents {
 *   'change:name': { name: string };
 * }
 *
 * class MyClass extends Evented<MyEvents> {
 *   static override EVENTS = { CHANGE_NAME: 'change:name' };
 * }
 * ```
 */
export default class Evented<TEvents extends object = Record<string, object>> implements IEvented<TEvents> {
  readonly #handlers = new Map<string, ((payload: any) => void)[]>();

  on<K extends keyof TEvents & string>(event: K, handler: (payload: TEvents[K]) => void): Subscription {
    if (!this.#handlers.has(event)) this.#handlers.set(event, []);
    this.#handlers.get(event)!.push(handler);
    return { remove: () => this.off(event, handler) };
  }

  off<K extends keyof TEvents & string>(event: K, handler: (payload: TEvents[K]) => void): void {
    const handlers = this.#handlers.get(event);
    if (!handlers) return;
    const filtered = handlers.filter(h => h !== handler);
    if (filtered.length) this.#handlers.set(event, filtered);
    else this.#handlers.delete(event);
  }

  emit<K extends keyof TEvents & string>(event: K, data: TEvents[K]): void {
    this.#handlers.get(event)?.slice().forEach(h => h(data));
  }
}
