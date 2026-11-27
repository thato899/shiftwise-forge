# Status — 27 November 2026 (SAST)

Phase: domain implementation and build-gate hardening. The repository has a Forge Jira global-page scaffold, synthetic dashboard, coverage, leave and overtime domain helpers, tests and security/product documentation.

## Latest increment — ticket #3
Replaced the incorrect worker-keyed matching behavior with a bounded search over distinct post slots. A worker can now cover multiple qualified posts in non-overlapping windows but cannot cover overlapping slots; the solver keeps the largest feasible assignment and reports per-post deficits. Duplicate worker/post IDs and invalid windows fail explicitly. Search is capped at 100,000 nodes and throws a manager-review error if that cap is reached.

Added tests for flexible-worker reassignment, overlapping capacity, non-overlapping shifts, deficits, exclusions and duplicate IDs. These tests now run successfully with the reproducible dependency installs added in ticket #1.

## Latest increment — ticket #1 build foundation
Added reproducible root and UI lockfiles, ESLint 9 flat configuration, Jest TypeScript transform configuration, and Jest globals in the TypeScript check. Updated Forge CLI to v16 so lint can run non-interactively and disabled CLI analytics explicitly in CI. Corrected an overtime test that incorrectly claimed a pure transition function could detect concurrent writes; atomic cross-record assignment remains a service/storage requirement.

Local checks on Node 24/npm 11 are listed in the run report; lockfile clean installs were also verified with npm 10. The full check sequence passes through production UI build. Forge lint reaches the actual manifest validation and fails because manifest.yml has no registered app ID. Registration requires a real Atlassian developer/Jira site and must not be fabricated.

GitHub Actions PR run #43 confirmed the docs job, both clean installs, lint, typecheck, all 20 tests, and production UI build pass on CI. The app job then fails only at Forge lint with: “Invalid app details in the manifest.yml file. Register your app by running forge register.”

The most recent run for draft PR #10 (#44) repeated that result: docs and all app steps through build passed; Forge lint stopped only because the manifest has no registered app ID. Draft PR #11 (ticket #2, stacked on #10) CI run #46 also passed docs, both clean installs, lint, typecheck, all 27 tests and UI build; it stopped at Forge lint for that same registration requirement.

## Latest increment — ticket #2 authorization policy
Added a pure authorization contract that derives account and tenant from Forge resolver context, validates an active server-loaded grant, checks the loaded record tenant and explicit site grant, then applies separate permissions for employee self-service, manager operations, HR policy/profile changes and redacted audit reads. Employees must match the grant's linked employee ID. Wildcard site grants are rejected. Synthetic tests cover missing/forged context, cross-tenant records, unauthorized sites, self-service boundaries, role privileges and invalid grants.

This helper is not yet connected to Forge storage or the resolver. It is not production access control; the HR grant bootstrap, persistent lookup, resolver enforcement and protected UI remain open work in #2. The ticket #2 branch is stacked on draft PR #10 so it inherits the lockfiles and executable CI checks; it does not change main.

Local validation on this increment passes lint, typecheck, the production UI build and 27 tests across five suites, including seven authorization tests. Forge lint and Jira installation remain blocked by the missing registered app ID.

## CI changes
CI requires both package lockfiles and runs clean installs, lint, typecheck, tests, production UI build and Forge lint. Missing lockfiles fail explicitly. Forge CLI runs with analytics disabled and non-interactive mode; the real app ID registration remains the lint/install blocker.

## Remaining blockers and work
- Forge app ID is not registered, app cannot yet install.
- Both lockfiles now exist and pass clean-install checks. A successful Forge lint/CI run remains blocked by app registration and ID.
- Forge storage, trusted tenant/site authorization wiring, HR grant bootstrap/configuration UI and persisted leave/overtime flows are not implemented. The new authorization module is currently a tested domain policy only.
- Cross-offer atomic slot claiming and Jira coverage issue creation are outstanding.
- Clean Jira-site installation, judge link, public demo and Devpost submission remain pending.

Next: continue #2 by implementing server-side grant lookup/bootstrap and applying it in every protected resolver, then build HR configuration. Thato still needs to register the Forge app and add its generated app ID before Forge lint and clean-site installation can pass.

## Gates
| Gate | State |
| --- | --- |
| Forge manifest and Jira module | Scaffold exists; app registration and Forge validation pending |
| App build, tests, Forge lint | Local lint/typecheck/tests/build pass; Forge lint pending registered app ID |
| Real install and end-to-end flow | Pending |
| Judge install link and instructions | Pending |
| Public YouTube demo under five minutes | Pending |
| Devpost entry before 22 Dec 2026, 12:00 PT (22:00 SAST) | Pending |

Do not represent the app as fully functional or installable yet.
