# Status — 27 November 2026 (SAST)

Phase: core workflow domain slices. Repository includes the Forge Jira global-page scaffold, synthetic dashboard, deterministic capacity-one coverage solver, staffing/credential/grade/working-time domain models, leave preview/decision policy, overtime eligibility checks, and a revision-checked voluntary overtime offer lifecycle.

## Latest increment — ticket #5
Added draft → published → accepted/declined/expired/cancelled → assigned state transitions. Employee response is limited to the invited worker; manager assignment is a separate action and requires the accepted offer plus current revision. Each transition returns an audit event. Added lifecycle tests for sequence, unauthorized response, stale concurrent actions, cancellation reason, expiry and declined offers.

This is domain logic only. It is not persisted, does not authenticate manager/employee actors from Forge context, does not atomically claim a shift slot across offers, and is not wired into the Jira UI. Ticket #5 remains open.

## Not yet complete
App is not installable or submission-ready. Forge app registration, lockfiles, executed app CI, real Forge storage, trusted resolver authorization, HR configuration UI, persisted workflows, Jira coverage issue integration, clean-site installation, demo video and Devpost submission remain pending. The green CI documentation job is not evidence that the app builds: app steps are conditionally skipped without package-lock.json.

## Next
1. Complete #1 foundation: register app ID, install dependencies, commit lockfiles, make CI fail if app checks are skipped, deploy to development and verify Jira installation.
2. Complete #2 with tenant/site-scoped persistence, server-side roles and HR configuration.
3. Wire #3 solver and #4 leave workflow to current persisted records with revision-safe decisions.
4. Complete #5 with atomic slot claims, persisted audit/events, Jira gap issue and end-to-end UI.
5. Complete clean-site install, public demo under five minutes and Devpost submission before 22 Dec 2026 12:00 PT (22:00 SAST).

## Gates
| Gate | State |
| --- | --- |
| Forge manifest and Jira module | Scaffold exists; app ID and Forge validation pending |
| App build, tests, Forge lint | Pending lockfile and successful app CI |
| Real install and end-to-end flow | Pending |
| Judge install link and instructions | Pending |
| Public YouTube demo under five minutes | Pending |
| Devpost entry | Pending |

Domain tests have been added but were not run in this environment. Do not represent the app as fully functional.
