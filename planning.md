# Agile delivery plan

Goal: a judge can install the Forge app on a Jira Cloud test site and demonstrate a complete staffing decision with synthetic data before 22 December 2026, 12:00 Pacific Time (22:00 SAST). Two-week planning is too coarse near deadline: run short weekly iterations and reassess daily. Track work in GitHub Issues; this file is the roadmap, not a substitute for tickets.

## Product increments
| Increment | Outcome | Exit gate |
| --- | --- | --- |
| 0 Foundation | Forge Jira app, CI, data model and permissions | Fresh install renders in Jira; checks green |
| 1 Configuration | HR defines posts, shift minima, criticality, skills, grade eligibility, employee qualifications and policy | Manager can configure and view one site safely |
| 2 Planning | Roster with actual post assignments and explainable coverage evaluation | Example of 4 engineers / minimum 3 rejects two overlapping absences |
| 3 Leave | Request, impact preview, authorized decision and audit trail | Pending request cannot alter coverage; conflicting approvals blocked |
| 4 Recovery | Coverage gap creates overtime offers for eligible employees, including previous shift subject to rest and hours; acceptance and manager assignment | No automatic forced overtime; competing claims handled |
| 5 Delivery | End-to-end demo, judge link, install guide, public YouTube video and Devpost submission | Independent test site installation works |

## Priority and dependencies
P0: Forge/Jira foundation → configuration → constraint engine → leave workflow → overtime flow → judge install and submission. P1: notifications, multi-site, fair rotation, swap flow, reporting. P2: Rovo agent, Atlassian MCP, Teamwork Graph and Marketplace; bonus entries only after working implementation and documentation.

## Agile cadence
Maintain a prioritized issue backlog with user story, context, dependencies, implementation notes, acceptance criteria and verification. Limit active work to one or two issues. Demo each increment with synthetic fixtures and capture feedback. STATUS.md records shipped work, blockers and next action. PRs must identify an issue and include evidence. Scope changes are recorded as decisions, then reflected in issues.

## Risk register
Forge install permissions and Jira site setup; deadline and demo time; assignment combinatorics; policy variations by jurisdiction; sensitive employee data; race conditions across simultaneous leave/overtime decisions. Mitigation: first prove an installable Jira module, use deterministic small-team matching, configurable policies, strict auth and versioned decision transactions.
