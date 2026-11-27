# Agile delivery plan

Goal: a judge can install the Forge app on a Jira Cloud test site and demonstrate a complete staffing decision with synthetic data before 22 December 2026, 12:00 Pacific Time (22:00 SAST). Track work in GitHub Issues; short iterations, limited active work and explicit demos.

## Product increments
| Increment | Outcome | Exit gate |
| --- | --- | --- |
| 0 Foundation | Forge Jira app, CI, data model and permissions | Fresh install renders in Jira; app checks green |
| 1 Configuration | HR defines posts, minima, criticality, skills, grade eligibility, qualifications and policy | Manager can configure and view one site safely |
| 2 Planning | Roster with actual post assignments and explainable coverage evaluation | Four engineers/minimum three scenario rejects two overlapping absences |
| 3 Leave | Request, manager decision and audit trail | Pending request cannot alter coverage; conflicting approvals blocked |
| 4 Recovery | Overtime offers, employee response, separate manager assignment | No automatic/forced overtime; accepted offer is revision-checked |
| 5 Delivery | End-to-end demo, judge link, install guide, public video and Devpost submission | Independent clean-site installation works |

## Current implementation notes
- Domain types and deterministic coverage, leave and overtime eligibility helpers are in src/domain.
- Overtime transition functions in src/domain/overtime.ts model voluntary publication, invited-worker response, expiry/cancellation and manager confirmation, with optimistic revision checks and returned audit events.
- These helpers are not yet persistence, trusted Forge authorization or atomic cross-offer slot claiming. Keep ticket #5 open until wired and verified end to end.
- Current GitHub Actions workflow skips all app checks when package-lock.json is absent; fix this in ticket #1. A green docs job is not an app build.

## Agile cadence
Maintain issues as the prioritized backlog with user story, context, dependencies, implementation notes, acceptance criteria and verification. Limit active work to one or two issues. Demo each increment with synthetic fixtures. Update STATUS.md as truth changes. PRs should identify issue and include command/CI evidence. Record decisions in docs/DECISIONS.md.

## Risk register
Forge app registration and Jira site access; deadline; matching complexity; policy variations; sensitive employee data; concurrent leave/overtime changes. Mitigate with early install validation, deterministic bounded matching, HR-reviewed policy, tenant/site checks and revision/transaction guards.
