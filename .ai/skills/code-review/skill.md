---
id: S04
name: code-review
description: Standardized formatting, severity classification, and checklist for auditing codebase health.
---

# S04 — Code Review

This skill defines the process and standards for all code reviews. The goal is a better codebase, not a perfect score.

## 1. Review Process

1. **READ FULLY:** Read the entire diff before writing a finding. Context matters.
2. **UNDERSTAND:** What problem does this code solve?
3. **REPORT:** Output findings in the standard format.
4. **RECOMMEND:** Provide actionable suggestions.

## 2. Finding Format

Use this exact structure for reporting issues:

\`\`\`text
───────────────────────────────────────────────────
[SEVERITY] #NUMBER — Short Title
Location  : file-path:line-number
Issue     : What is wrong and why it matters
Suggestion: Concrete code fix or architectural suggestion
───────────────────────────────────────────────────
\`\`\`

## 3. Severity Classification

- `CRITICAL`: Correctness bug, state corruption, infinite loops.
- `MAJOR`: SOLID violation, significant maintainability problem, or broken encapsulation.
- `MINOR`: Naming issue, code smell, DRY opportunity.
- `POSITIVE`: Code that is exemplary.

## 4. Review Checklist

### 4.1 Correctness & State
- Are there obvious logic bugs?
- Are errors handled (no silent empty catches)?
- Are async operations properly awaited?

### 4.2 Clean Code & Principles
- Are names self-documenting?
- Are exports placed exclusively at the bottom of the file?
- Are magic numbers extracted to constants?
- Is there an unjustifiable level of complexity? (KISS)

### 4.3 TypeScript Quality
- Is the use of `any` or `unknown` justified? (It is allowed, but should make sense contextually).
- Are non-null assertions (!) used without a clear reason?

### 4.4 Web Components
- Are all event listeners removed in `cleanup()` to prevent memory leaks?
- Is the component rendering to the Light DOM (no Shadow DOM)?
- Are `on()` and `emit()` being used for event handling?