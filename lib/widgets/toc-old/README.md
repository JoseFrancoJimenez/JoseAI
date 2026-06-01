# TOC — Table of Contents

Two-piece architecture: a **model** that owns the tree structure, and a **component** that renders it.

---

## Files

| File | Role |
|---|---|
| `@lib/components/toc/toc.types.ts` | Shared types: `ITocNodeDef`, `ITocNode`, `ITocModelEvents` |
| `@lib/components/toc/toc-model.ts` | `TocModel` — tree state, mutations, events |
| `@lib/widgets/toc/toc-component.ts` | `TocComponent` — custom element, renders the tree |
| `@lib/widgets/toc/toc-component.css` | Base panel styles |

---

## 1. Input format — `ITocNodeDef`

The model is built from a **flat array**. Order does not matter — parent references are resolved in a second pass.

```ts
interface ITocNodeDef {
  id: string;
  parent_id: string | null; // null = top-level node
  type: string;             // any string: 'layer', 'group', 'folder', etc.
}
```

```json
[
  { "id": "Root",  "parent_id": null,   "type": "group" },
  { "id": "LayerA","parent_id": "Root", "type": "layer" },
  { "id": "LayerB","parent_id": "Root", "type": "layer" }
]
```

---

## 2. TocModel

### Construction

```ts
import { TocModel } from '@lib/components/toc/toc-model.ts';
import type { ITocNodeDef } from '@lib/components/toc/toc.types.ts';

const model = new TocModel(defs as ITocNodeDef[]);
```

### Read API

```ts
model.roots           // readonly ITocNode[] — top-level nodes
model.size            // number — total node count
model.get('LayerA')   // ITocNode | undefined

// Depth-first iteration
for (const node of model) {
  console.log(node.id, node.depth, node.type);
}
```

### Mutation API

All mutations emit `'add'` / `'remove'` / `'move'` **and** `'change'`. The component re-renders automatically on `'add'`, `'remove'`, and `'move'`.

```ts
// Add a new node
model.add({ id: 'NewLayer', parent_id: 'Root', type: 'layer' });

// Remove a node and its entire subtree
model.remove('Root'); // also removes LayerA and LayerB

// Move a node to a new parent (or to the top level)
model.move('LayerA', 'OtherGroup');
model.move('LayerA', null); // promotes to top level

// Remove all nodes
model.clear();
```

Throws if:
- `add` — id already exists, or `parent_id` not found
- `remove` / `move` — id not found
- `move` — would create a cycle

### Events

```ts
import type { Subscription } from '@lib/components/evented.ts';

const sub: Subscription = model.on('change', () => { /* tree changed */ });
model.on('add',    ({ node }) => console.log('added',   node.id));
model.on('remove', ({ node }) => console.log('removed', node.id));
model.on('move',   ({ node, previousParent }) => { /* ... */ });

// Unsubscribe
sub.remove();
```

---

## 3. TocComponent

A custom element (`<toc-component>`). Handles:
- Rendering the tree with expand/collapse
- Re-rendering automatically when the model fires `'add'`, `'remove'`, `'move'`, or `'clear'`

### Setup

Call `setup()` **before** appending to the DOM.

```ts
import { TocComponent } from '@lib/widgets/toc/toc-component.ts';

const toc = document.createElement(TocComponent.tagName) as TocComponent;
toc.setup(model, renderNode);
container.appendChild(toc);
```

### renderNode — `(node: ITocNode) => string`

The consumer controls 100% of the content inside each row. The component only provides the tree chrome (indentation, expand/collapse toggle).

```ts
// Simple label
toc.setup(model, node => `<span>${node.id}</span>`);

// Differentiate by type
toc.setup(model, node => {
  if (node.type === 'layer') {
    return `
      <label class="my-layer">
        <input type="checkbox" checked>
        <span>${node.id}</span>
      </label>`;
  }
  return `<span class="my-group">${node.id}</span>`;
});
```

**Expand/collapse:** any node that has children in the tree gets a toggle — clicking its label text also expands/collapses. This is driven by the node's children count, not by its `type` string.

**Expand state:** all nodes start collapsed.

### Listening to events

All DOM events from node content bubble naturally out of the component. The component only intercepts clicks on the expand/collapse toggle and expandable-node labels (both handled internally and stopped there).

To identify which node an event came from, use `closest('.toc-node')` on the event target:

```ts
toc.addEventListener('change', (e: Event) => {
  const target = e.target as HTMLElement;
  const nodeId = target.closest<HTMLElement>('.toc-node')?.dataset.nodeId;
  if (!nodeId) return;

  if (target instanceof HTMLInputElement && target.type === 'checkbox') {
    console.log(`${nodeId} checkbox → ${target.checked}`);
  }
});

// Custom events work the same way — as long as they bubble.
toc.addEventListener('my-custom-event', (e: Event) => {
  const nodeId = (e.target as Element).closest<HTMLElement>('.toc-node')?.dataset.nodeId;
});
```

---

## 4. Complete example

```ts
import { TocModel }     from '@lib/components/toc/toc-model.ts';
import { TocComponent } from '@lib/widgets/toc/toc-component.ts';
import type { ITocNodeDef, ITocNode } from '@lib/components/toc/toc.types.ts';

const defs: ITocNodeDef[] = [
  { id: 'Basemaps', parent_id: null,       type: 'group' },
  { id: 'Streets',  parent_id: 'Basemaps', type: 'layer' },
  { id: 'Terrain',  parent_id: 'Basemaps', type: 'layer' },
  { id: 'Labels',   parent_id: null,       type: 'layer' },
];

const model = new TocModel(defs);
const visibility = new Map(defs.filter(d => d.type === 'layer').map(d => [d.id, true]));

function renderNode(node: ITocNode): string {
  if (node.type === 'layer') {
    return `
      <label class="toc-layer">
        <input type="checkbox" ${visibility.get(node.id) ? 'checked' : ''}>
        <span>${node.id}</span>
      </label>`;
  }
  return `<span class="toc-group-name">${node.id}</span>`;
}

const toc = document.createElement(TocComponent.tagName) as TocComponent;
toc.setup(model, renderNode);
document.body.appendChild(toc);

toc.addEventListener('change', (e: Event) => {
  const target = e.target as HTMLElement;
  const nodeId = target.closest<HTMLElement>('.toc-node')?.dataset.nodeId;
  if (!nodeId) return;
  if (target instanceof HTMLInputElement && target.type === 'checkbox') {
    visibility.set(nodeId, target.checked);
    // If you mutate the model here, the component re-renders and renderNode
    // will read the updated visibility map — checkboxes stay in sync.
  }
});

// Programmatic mutation — component re-renders automatically
model.add({ id: 'Traffic', parent_id: 'Basemaps', type: 'layer' });
model.move('Labels', 'Basemaps');
model.remove('Terrain');
```

---

## 5. Positioning

`toc-component` is `display: block` with no position. In the testApp it is positioned as an overlay:

```css
toc-component {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 100;
  width: 260px;
  max-height: calc(100vh - 40px);
}
```

Adjust as needed for your layout.
