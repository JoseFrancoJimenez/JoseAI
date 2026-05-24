abstract class BaseComponent extends HTMLElement {
  connectedCallback(): void {
    this.render();
    this.bindEvents();
  }

  disconnectedCallback(): void {
    this.cleanup();
  }

  abstract html(): string;

  render(): void {
    this.innerHTML = this.html();
  }

  on(event: string, handler: EventListenerOrEventListenerObject): void {
    this.addEventListener(event, handler);
  }

  emit(event: string, detail?: unknown): void {
    this.dispatchEvent(new CustomEvent(event, { bubbles: true, detail }));
  }

  protected abstract bindEvents(): void;
  protected abstract cleanup(): void;
}

export { BaseComponent };
