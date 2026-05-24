import Evented from './evented.ts';

export default class Component<TEvents extends object = Record<string, object>> extends Evented<TEvents> {
  static EVENTS: Record<string, string> = {};
}
