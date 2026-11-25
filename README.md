# Shiftwise — coverage-aware shifts and leave

A Codegeist 2026 **Apps for Business Teams** project by Thato Maluleka. Shiftwise is planned as a Forge app in Jira for HR, shift managers and employees. It explains whether a leave request leaves every required post staffed by qualified people, and coordinates voluntary overtime when coverage fails.

**Current state:** repository and delivery plan only. The Forge app is not implemented or installable yet. See [STATUS.md](STATUS.md).

## The example
Engine maintenance needs three qualified people per day shift. Four are assigned. One leave request leaves three and may be approved. A second overlapping request leaves two, so the app explains the one-person gap, proposes eligible coverage and routes the decision to a manager. It can invite a qualified prior-shift employee to overtime only if rest and working-hour policy permits. Employee acceptance and manager assignment are separate steps.

## Product rules
HR configures post minima, criticality, skills and credential validity, employee eligibility for multiple posts, grade/pay-policy constraints and working-time rules. The engine checks a feasible assignment across simultaneous posts, not just headcount. Unknown eligibility fails closed. Salary data stays restricted to HR. Leave and overtime decisions have human approval and an audit trail.

## Build and delivery
Start with [AGENTS.md](AGENTS.md) for the mandate and workflow; [planning.md](planning.md) for increments; [docs/PRODUCT.md](docs/PRODUCT.md) for behavior; [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for boundaries; [docs/SUBMISSION.md](docs/SUBMISSION.md) for Codegeist gates; [docs/INSTALL.md](docs/INSTALL.md) for the eventual judge flow; and [docs/DECISIONS.md](docs/DECISIONS.md) for tradeoffs. Work is tracked in GitHub Issues and short PRs. CI checks documentation now and will run app checks after the lockfile and Forge manifest arrive. No deployment secrets belong in CI.

Official challenge: https://codegeist2026.devpost.com/ . Submission deadline: 22 December 2026, 12:00 Pacific Time (22:00 SAST). A working Forge installation link, public YouTube demo under five minutes, and full Devpost submission are still required.