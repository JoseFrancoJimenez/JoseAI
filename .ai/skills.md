---
name: skills-routing-matrix
description: Core routing matrix for Claude Code and other AI assistants. Directs which skill to load based on the user prompt.
---

# AI Skills Inventory & Routing Matrix

**Target Audience:** Any AI Assistant / Agent
**Purpose:** Defines the available modular skills for this project and strictly dictates when an AI must load them.

## Universal Rule: NO AUTOMATIC SKILL LOADING
AI Assistants MUST NOT load the files in the `Path` column automatically. Evaluate the user's current prompt against the `Trigger Condition`. If it matches, load the file from the `Path` before executing the task. 

## Skill Routing Matrix

| ID | Skill Name | Trigger Condition (Load when...) | Path |
| :--- | :--- | :--- | :--- |
| **S01** | Vanilla TS Architecture | Creating a new module, class, or utility; designing a shared type system; refactoring existing TS code; establishing module boundaries. | `.ai/skills/vanilla-ts-architecture.md` |
| **S02** | Vanilla TS Web Components | Creating a custom element, web component, component lifecycle, custom events, or any browser-native UI component. | `.ai/skills/vanilla-ts-web-components.md` |
| **S03** | Write Clean Code | Writing any new code, implementing any feature, or refactoring. Governs HOW code is written (SOLID, DRY, Naming). | `.ai/skills/write-clean-code.md` |
| **S04** | Code Review | Asked to review, audit, or critique existing code; identifying code smells, anti-patterns, or generating refactoring plans. | `.ai/skills/code-review/skill.md` |
| **S05** | Frontend Design | Building web components, pages, dashboards, HTML/CSS layouts, or styling/beautifying any web UI. Generates polished, production-grade frontend code with intentional aesthetic direction. | `.ai/skills/frontend-design/frontend-design.md` |
| **S06** | Skill Creator | Creating a new skill from scratch, editing or improving an existing skill, running evals, or benchmarking skill performance. | `.ai/skills/skill-creator/SKILL.md` |
