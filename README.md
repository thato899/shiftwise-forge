# Shiftwise — coverage-aware shifts and leave

A Codegeist 2026 **Apps for Business Teams** project by Thato Maluleka. Shiftwise is being built as a Forge app for Jira to help HR and operations managers make explainable staffing and leave decisions.

**Current state:** A Forge Jira global-page scaffold and domain logic are in the repository. The app is not yet installable or submission-ready. See [STATUS.md](STATUS.md).

## The example
Engine maintenance needs three qualified people per day shift. Four are assigned. One leave request leaves three and may be approved. A second overlapping request leaves two, so the app explains the one-person gap and helps coordinate eligible overtime coverage. A prior-shift worker may be offered overtime only if HR-reviewed rest and working-hour policy permits. Employee acceptance and manager assignment are separate.

## Product rules
HR configures post minima, criticality, skills and credential validity, employee eligibility for multiple posts, explicit grade rules and working-time policy. The solver produces a feasible assignment across simultaneous posts, not just a headcount. Unknown eligibility fails closed. Salary data stays restricted to HR. Leave and overtime decisions require human authorization.

## Build and delivery
Read [AGENTS.md](AGENTS.md), [planning.md](planning.md), [docs/PRODUCT.md](docs/PRODUCT.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/SECURITY.md](docs/SECURITY.md), and [docs/SUBMISSION.md](docs/SUBMISSION.md). Work is tracked in GitHub Issues and small PRs. CI requires root and UI lockfiles and runs lint, typecheck, tests, builds and Forge lint. It must not report green by skipping app checks.

Official challenge: https://codegeist2026.devpost.com/ . Submission deadline: 22 December 2026, 12:00 Pacific Time (22:00 SAST). A working Forge installation link, public YouTube demo under five minutes, and full Devpost submission are still required.
