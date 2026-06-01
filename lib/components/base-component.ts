/**
 * Abstract base class for all Light DOM web components.
 * Handles rendering and event lifecycle. Extend this class and implement
 * `html()`, `bindEvents()`, and `cleanup()`.
 */
abstract class BaseComponent extends HTMLElement {
  /** Called by the browser when the element is inserted into the DOM. Renders and binds events. */
  connectedCallback(): void {
    this.render();
    this.bindEvents();
  }

  /** Called by the browser when the element is removed from the DOM. Runs cleanup. */
  disconnectedCallback(): void {
    this.cleanup();
  }

  /** Returns the HTML string for this component. Override to provide markup. */
  html(): string { return ''; }

  /** Renders the HTML string into the Light DOM. */
  protected render(): void {
    this.innerHTML = this.html();
  }

  /** Attaches a listener to this element. */
  on(event: string, handler: EventListenerOrEventListenerObject): void {
    this.addEventListener(event, handler);
  }

  /** Dispatches a bubbling CustomEvent from this element. */
  emit(event: string, detail?: unknown): void {
    this.dispatchEvent(new CustomEvent(event, { bubbles: true, detail }));
  }

  /** Bind all internal DOM event listeners. */
  protected abstract bindEvents(): void;

  /** Remove all event listeners to prevent memory leaks. */
  protected abstract cleanup(): void;
}

export { BaseComponent };
