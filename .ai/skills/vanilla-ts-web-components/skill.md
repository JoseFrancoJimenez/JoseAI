---
id: S02
name: vanilla-ts-web-components
description: Rules for Light DOM components, template factories, and event management without frameworks.
---

# S02 — Vanilla TS Web Components

This skill governs the design of native Web Components (Custom Elements v1) written in vanilla TypeScript. Strictly NO Shadow DOM, no slots, and no adopted stylesheets.

## 1. The Light DOM Base Class

All components MUST extend a shared `BaseComponent`. This class handles the Light DOM rendering using the Template Factory pattern and provides event utilities.

\`\`\`typescript
abstract class BaseComponent extends HTMLElement {
  /** 
   * Called by the browser when inserted into the DOM.
   * Do not override unless strictly necessary. Override bindEvents() instead.
   */
  connectedCallback(): void {
    this.render();
    this.bindEvents();
  }

  disconnectedCallback(): void {
    this.cleanup();
  }

  /** Generates the raw HTML string for the component. */
  abstract html(): string;

  /** Renders the html string into the Light DOM. */
  render(): void {
    this.innerHTML = this.html();
  }

  /** Utility to attach event listeners */
  on(event: string, handler: EventListenerOrEventListenerObject): void {
    this.addEventListener(event, handler);
  }

  /** Utility to emit Custom Events up the DOM tree */
  emit(event: string, detail?: unknown): void {
    this.dispatchEvent(new CustomEvent(event, { bubbles: true, detail }));
  }

  /** Bind all internal DOM event listeners. */
  protected abstract bindEvents(): void;

  /** Remove all event listeners. Prevent memory leaks. */
  protected abstract cleanup(): void;
}

export { BaseComponent };
\`\`\`

## 2. Component Implementation Rules

- **Tag Naming:** The tag name must always be lowercase with dashes (e.g., `data-table-component`). Never hardcode the string multiple times; use a static `tagName` property.
- **CSS Classes:** Classes should not be hardcoded as static strings if they depend on state. Generate them dynamically within the `html()` method.
- **No Shadow DOM:** Do not use `this.attachShadow()`. All elements live in the global Light DOM.
- **Registration:** Register the custom element at the bottom of the file, right before the exports.

\`\`\`typescript
class DataCardComponent extends BaseComponent {
  static readonly tagName = 'data-card-component';
  private title: string = 'Default';

  html(): string {
    return \`
      <div class="card \${this.title ? 'has-title' : ''}">
        <h2>\${this.title}</h2>
      </div>
    \`;
  }

  protected bindEvents(): void {
    // Add listeners using this.querySelector() and this.on()
  }

  protected cleanup(): void {
    // Remove listeners to prevent memory leaks
  }
}

if (!customElements.get(DataCardComponent.tagName)) {
  customElements.define(DataCardComponent.tagName, DataCardComponent);
}

export { DataCardComponent };
\`\`\`