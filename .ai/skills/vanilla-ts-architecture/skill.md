---
id: S01
name: vanilla-ts-architecture
description: Strict rules for pure TypeScript modules, pragmatic type safety, and export conventions.
---

# S01 — Vanilla TS Architecture

This skill defines the patterns for structuring TypeScript code. Apply every rule here to all TS code written in this project.

## 1. File & Folder Naming

| Target              | Convention          | Example                        |
|---------------------|---------------------|--------------------------------|
| Source files        | `kebab-case.ts`     | `layer-manager.ts`             |
| Type-only files     | `kebab-case.types.ts`| `coordinate.types.ts`         |
| Barrel files        | `index.ts`          | `index.ts`                     |
| Classes             | `PascalCase`        | `LayerManager`                 |
| Interfaces          | `IPascalCase`       | `ILayerProvider`               |
| Functions           | `camelCase`         | `transformCoordinate()`        |
| Constants           | `SCREAMING_SNAKE`   | `DEFAULT_PROJECTION`           |

## 2. Module & Export Rules

- **Named Exports Only:** Default exports are strictly banned.
- **Exports at the Bottom:** All `export` statements MUST be placed at the very bottom of the module. Do not export inline where the class or function is defined.

\`\`\`typescript
// ❌ Bad (Inline export, Default export)
export default class LayerManager { ... }
export const helper = () => { ... }

// ✅ Good (Bottom of the file)
class LayerManager { ... }
const helper = () => { ... }

export { LayerManager, helper };
\`\`\`

## 3. Class & Interface Guidelines

- **Interface-First Design:** Code against the interface, not the concrete type when possible.
- **Immutability:** Mark class properties that don't need mutation as `readonly`.

## 4. Pragmatic Type System Standards

- **Strict Mode:** Assume `strict: true` is on.
- **Pragmatic any and unknown:** The use of `any` and `unknown` is ALLOWED when dealing with external boundaries, un-typed third-party payloads, or highly dynamic structures where strict typing is an architectural bottleneck. Avoid `any` for core business logic, but use it pragmatically elsewhere.
- **Utility Types:** Leverage built-in utility types: `Readonly<T>`, `Partial<T>`, `Pick<T, K>`, `Omit<T, K>`.

## 5. Error Handling Patterns

- Empty `catch` blocks are banned.
- Every `catch` must either re-throw, log, or handle the error properly.