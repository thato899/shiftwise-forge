# Status — 26 November 2026 (SAST)

Phase: core domain implementation. Repository includes the Forge Jira global-page scaffold, a synthetic dashboard wired to a deterministic capacity-one coverage solver, leave preview/decision policy functions, staffing and working-time policy types/validators, overtime eligibility filtering, focused tests, and security/data-model documentation.

## Not yet complete
The app is not installable or submission-ready. Forge app ID registration, dependency lockfiles, successful app CI, real Forge storage, trusted resolver authorization, HR configuration UI, persisted leave/overtime workflow, Jira coverage issue integration, clean-site install, video and Devpost submission remain pending. GitHub Actions green documentation checks do not validate app code while package files are absent.

## Next
1. Finish #1: register Forge app ID, install dependencies and commit lockfiles, correct CI to execute checks, deploy to development and verify Jira install.
2. Finish #2: server-side role/site authorization and HR configuration backed by tenant-scoped storage.
3. Wire #3 solver to versioned roster/policy data and display explainable deficits.
4. Wire #4 leave request and revision-checked manager decision to persisted state.
5. Wire #5 overtime offers, worker response, manager confirmation and Jira issue for unresolved gaps.

## Gates
| Gate | State |
| --- | --- |
| Forge manifest and Jira module | Scaffold exists; app ID and Forge validation pending |
| App build/tests/Forge lint | Pending dependency lockfile and completed app CI |
| Real app installation and end-to-end flow | Pending |
| Judge installation link and instructions | Pending |
| Public YouTube video under five minutes | Pending |
| Devpost entry before 22 Dec 2026, 12:00 PT (22:00 SAST) | Pending |

Core domain helper tests have been added but not independently run in a local checkout. Do not represent the project as fully functional yet.
