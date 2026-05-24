import Evented from './evented.ts';
import type { IEvented, Subscription } from './evented.ts';

export default class Component<TEvents extends object = Record<string, object>> {
  static EVENTS: Record<string, string> = {};

  readonly #evented: IEvented<TEvents> = new Evented<TEvents>();

  on<K extends keyof TEvents & string>(event: K, handler: (payload: TEvents[K]) => void): Subscription {
    return this.#evented.on(event, handler);
  }

  protected emit<K extends keyof TEvents & string>(event: K, data: TEvents[K]): void {
    this.#evented.emit(event, data);
  }
}
