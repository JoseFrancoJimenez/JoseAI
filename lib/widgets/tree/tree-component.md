# TreeComponent

A generic, reusable web component that renders a [`Tree<T>`](../../components/tree/tree.ts) as a nested expandable list. It is display-only — it has no opinion about what `T` is or what each row looks like.

---

## 1. Register the element

The component self-registers when the module is imported. One import is enough for the whole app.

```ts
import { TreeComponent } from '@lib/widgets/tree/tree-component.ts';
```

---

## 2. Create the element and call `setup()`

```ts
const el = document.createElement(TreeComponent.tagName) as TreeComponent;
el.setup(tree, renderFn, keyFn);
container.appendChild(el);
```

`setup()` must be called **before** the element is added to the DOM. Once appended, `connectedCallback` fires, which calls `render()` then `bindEvents()`.

### `setup<T>(tree, renderFn, keyFn)`

| Parameter  | Type                    | Purpose |
|------------|-------------------------|---------|
| `tree`     | `Tree<T>`               | The model. The component subscribes to its `change` event and re-renders automatically when the tree structure changes. |
| `renderFn` | `(item: T) => string`   | Returns the HTML string for a single node. Can be a plain label or rich HTML — see examples below. |
| `keyFn`    | `(item: T) => string`   | Returns a stable unique string for an item. Used for `data-key` attributes in the DOM and for matching click targets back to nodes. |

---

## 3. Example A — simple label list

The minimal case: render each item as a plain text label.

```ts
import { Tree } from '@lib/components/tree/tree.ts';
import { TreeComponent } from '@lib/widgets/tree/tree-component.ts';

interface Category { id: string; name: string; }

const tree = new Tree<Category>();
tree.addNode({ id: 'fruits',  name: 'Fruits'  });
tree.addNode({ id: 'veggies', name: 'Veggies' });
tree.addNode({ id: 'apple',   name: 'Apple'   }, { id: 'fruits',  name: 'Fruits'  });
tree.addNode({ id: 'carrot',  name: 'Carrot'  }, { id: 'veggies', name: 'Veggies' });

const el = document.createElement(TreeComponent.tagName) as TreeComponent;
el.setup(
  tree,
  item => item.name,       // renderFn — plain text
  item => item.id,         // keyFn
);
document.body.appendChild(el);
```

The component renders a collapsible tree. Root nodes start expanded. Clicking the arrow toggles their children.

---

## 4. Example B — rich layer panel (testApp)

`renderFn` can return any HTML string. The testApp uses this to build a full layer control panel — title, visibility checkbox, variable selector, and legend — all driven by `TreeComponent`.

### Build the tree

```ts
// application.ts
const layers = this.#map.getLayers() as VectorAppLayer[];
const tree = new Tree<VectorAppLayer>();
for (const layer of layers) tree.addNode(layer);
```

All layers are root nodes (flat tree, no parent–child nesting).

### Create and mount the panel

```ts
const panel = document.createElement(TreeComponent.tagName) as TreeComponent;
panel.className = 'layer-panel';   // CSS hook for positioning

panel.setup(
  tree,
  (layer) => this.#layerNodeHtml(layer),  // rich HTML per row
  (layer) => layer.id,
);
this.appendChild(panel);
```

### The `renderFn` returns full layer HTML

```ts
#layerNodeHtml(layer: VectorAppLayer): string {
  const { items } = layer.legend;

  const legendHtml = items.map(item => {
    const swatch = item.symbol
      ? `<img class="legend-icon" src="${item.symbol}" alt="">`
      : `<span class="legend-swatch" style="background-color:${item.color ?? 'transparent'}"></span>`;
    return `<div class="legend-item">${swatch}<span class="legend-item-label">${item.label}</span></div>`;
  }).join('');

  return `
    <div class="layer-block">
      <div class="layer-block-title">${layer.label}</div>
      <div class="layer-block-row">
        <input type="checkbox" data-layer-id="${layer.id}" ${layer.visible ? 'checked' : ''}>
        <label>Visible</label>
        ${layer.variables.length > 0 ? `
          <select data-layer-id="${layer.id}" class="layer-block-select">
            ${layer.variables.map(v =>
              `<option value="${v.id}"${v.id === layer.variable?.id ? ' selected' : ''}>${v.id}</option>`
            ).join('')}
          </select>
        ` : ''}
      </div>
      ${legendHtml ? `<div class="legend-items">${legendHtml}</div>` : ''}
    </div>
  `;
}
```

### Wire up interactivity via event delegation

`TreeComponent` is generic and knows nothing about layer controls. Add a `change` listener directly on the panel element — it catches checkbox and select events from any depth.

```ts
panel.addEventListener('change', (e: Event) => {
  const target = e.target as HTMLInputElement | HTMLSelectElement;
  const layerId = target.dataset['layerId'];
  if (!layerId) return;

  const layer = layers.find(l => l.id === layerId);
  if (!layer) return;

  if (target instanceof HTMLInputElement) {
    layer.visible = target.checked;          // triggers 'change:visible'
  } else if (target instanceof HTMLSelectElement) {
    layer.setVariable(target.value);         // triggers 'change:variable'
  }
});
```

### Keep the panel in sync with layer state

When a layer's variable or visibility changes, call `panel.render()` to re-run every `renderFn` and update the DOM. The expand/collapse state is preserved across renders.

```ts
for (const layer of layers) {
  layer.on('change:variable', () => panel.render());
  layer.on('change:visible',  () => panel.render());
}
```

---

## 5. Events emitted by TreeComponent

These bubble from the component element. Listen on a parent or the component itself.

| Event           | `detail`           | Fired when |
|-----------------|--------------------|------------|
| `tree:select`   | `ITreeNode<T>`     | User clicks a row label |
| `tree:expand`   | `ITreeNode<T>`     | User expands a node |
| `tree:collapse` | `ITreeNode<T>`     | User collapses a node |

```ts
el.addEventListener('tree:select', (e: Event) => {
  const node = (e as CustomEvent).detail as ITreeNode<Category>;
  console.log('selected:', node.item.name);
});
```

---

## 6. Reactive updates from the tree model

The component subscribes to `tree.on('change', ...)` automatically. Adding or removing nodes triggers a full re-render with expand state preserved.

```ts
tree.addNode({ id: 'mango', name: 'Mango' }, fruits);  // panel updates automatically
tree.removeNode(apple);                                 // panel updates automatically
```

---

## 7. CSS customisation

The component ships with base styles in [`tree-component.css`](./tree-component.css). Override per context using a class on the element.

```css
/* Position the panel and suppress the indent column (flat list) */
tree-component.layer-panel {
  position: absolute;
  top: 12px;
  right: 12px;
}

tree-component.layer-panel .tree-indent {
  display: none;
}

/* Disable row hover when rows contain interactive controls */
tree-component.layer-panel .tree-row {
  cursor: default;
}

tree-component.layer-panel .tree-row:hover {
  background: none;
}
```

### Available CSS hooks

| Selector         | Element |
|------------------|---------|
| `.tree-list`     | `<ul>` wrapping root nodes |
| `.tree-list--nested` | `<ul>` wrapping children (indented) |
| `.tree-row`      | Flex container holding the toggle and label |
| `.tree-toggle`   | Expand/collapse `<button>` |
| `.tree-arrow`    | The `▶` glyph inside the toggle (rotates on expand) |
| `.tree-indent`   | Spacer shown on leaf nodes instead of a toggle |
| `.tree-label`    | `<div>` holding the output of `renderFn` |
