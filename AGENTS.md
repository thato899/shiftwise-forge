# Agent mandate

You are building Shiftwise for Codegeist 2026. Read README.md, planning.md, STATUS.md, docs/PRODUCT.md, docs/ARCHITECTURE.md, docs/SUBMISSION.md and the linked issue before changing code. The owner is Thato Maluleka. Preserve the user's intent: HR and shift managers set staffing minima, critical posts, skills, qualification validity and pay/grade constraints; employees can cover eligible posts; leave decisions depend on actual feasible coverage; uncovered shifts trigger controlled overtime offers to qualified staff, including the prior shift where rest rules allow.

## Non-negotiable behavior
- Never approve leave solely because aggregate headcount meets a threshold. Find an actual assignment satisfying simultaneous post minima, skills, availability, rest, maximum hours, approval and site constraints.
- A salary or grade is an eligibility constraint configured by HR, never inferred from a person's pay alone. Do not expose salary to coworkers or in public logs.
- A coverage deficit creates an escalation and proposed overtime opportunity; it does not silently authorize overtime, extend a shift, approve leave, or assign an employee. Manager approval and employee acceptance are separate recorded events.
- Respect local working-time rules configured per deployment; legal defaults must be reviewed by HR. If policy is missing or uncertain, route to human review.
- No live employee records in fixtures, screenshots, demo, logs or issues. Use synthetic data. Enforce role access and tenant isolation server side.
- Prefer deterministic, explainable allocation for hard constraints. AI may summarize or suggest, but cannot override a failed coverage check.
- This is a Forge app integrated with Jira. Keep Forge manifest and module real; document installation and permissions. Do not claim bonus integrations until they work.

## Workflow
1. Pick one GitHub issue, confirm scope and acceptance criteria; update planning.md and STATUS.md.
2. Branch from main as feat/<issue>-short-name, fix/<issue>-short-name, or docs/<issue>-short-name. Keep PRs small.
3. Implement vertical slices, including authorization, empty/error states and necessary meaningful tests.
4. Run documented lint, typecheck, tests, build and forge lint where configured; record results and limitations in PR.
5. Open PR linked with Closes #N. Review against issue, security and Codegeist requirements; merge only after required checks. Update STATUS.md and close issue via merge.
6. Never commit secrets, tokens, private HR data or generated build output. Document new decisions in docs/DECISIONS.md.

Definition of done: acceptance criteria demonstrated, checks pass, UX states considered, accessible keyboard flow, privacy boundaries reviewed, docs updated, and a reproducible judge path exists for released features.
