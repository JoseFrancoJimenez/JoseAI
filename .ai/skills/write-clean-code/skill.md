---
id: S03
name: write-clean-code
description: Core philosophy for readability, maintainability, naming conventions, and SOLID principles.
---

# S03 — Write Clean Code

Optimize for readability and maintainability. Performance second (and only when measured).

## 1. Naming — The Most Important Thing

Names must reveal intent. If a name needs a comment to explain it, the name is wrong.
- **Variables:** describe what it holds (`userList`, `isLoading`).
- **Functions:** use a verb + noun (`fetchUser`, `buildLayerConfig`).
- **Booleans:** use `is`, `has`, `can` prefixes.

## 2. Functions

- Keep functions focused. A function should ideally do one thing well.
- Limit parameters. More than 3 → take a config object instead.
- Zero side effects in functions named like queries (`getUser` must not mutate state).

## 3. No Magic Numbers or Strings

Extract hardcoded values into named constants at the top of the file.

\`\`\`typescript
// ❌ Bad
if (zoom > 14) { ... }

// ✅ Good
const MIN_STREET_LEVEL_ZOOM = 14;
if (zoom > MIN_STREET_LEVEL_ZOOM) { ... }
\`\`\`

## 4. Code Smells to Avoid

- **Dead Code:** Remove commented-out code and unused variables. Git history exists for a reason.
- **Comments as Crutches:** Code explains WHAT. Comments explain WHY. Do not write comments that merely restate the code.

## 5. Architecture Principles (SOLID & DRY)

- **Single Responsibility (SRP):** A class or module should have one reason to change. Separate data fetching from UI rendering.
- **Open/Closed (OCP):** Open for extension, closed for modification. Use interfaces or strategies instead of massive `switch` statements.
- **DRY (Don't Repeat Yourself):** Avoid duplicating business logic. However, do not prematurely abstract code just because it looks similar (Rule of Three).
- **KISS (Keep It Simple, Stupid):** The simplest solution that works is the best. Avoid Enterprise patterns (like Factories of Factories) unless strictly necessary.