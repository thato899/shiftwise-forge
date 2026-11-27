# Architecture decisions

## 001 — Forge with Jira first
Date: 25 November 2026. Codegeist requires Forge and an Atlassian integration. Jira provides a concrete operational exception record while Forge provides the workflow. First prove an installable module before expanding to bonus integrations.

## 002 — Deterministic coverage and human approval
Date: 25 November 2026. Allocation is a hard constraint problem, evaluated with an actual feasible assignment. AI suggestions cannot change policy outcomes. Overtime offers and leave decisions require authorized manager actions and employee acceptance where relevant.

## 003 — Configurable pay-grade mobility
Date: 25 November 2026. Skills and current credentials establish competency; HR-defined eligibility rules govern cross-post movement. Compensation is restricted data and excluded from employee-facing screens and Jira issues.

## 2026-11-27 — Reproducible test and Forge CLI checks

- Pin the complete root and UI dependency graph in npm lockfiles; CI uses clean installs rather than skipping app checks.
- Keep ESLint 9 on its flat configuration and configure Jest with ts-jest so lint, typecheck and tests execute against the TypeScript source.
- Run Forge CLI lint non-interactively with analytics disabled in CI. App registration is an external prerequisite; no placeholder app ID is permitted.
- The overtime lifecycle helpers enforce revision equality against the supplied record, but concurrent assignment prevention requires atomic storage and is not claimed by these pure functions.
