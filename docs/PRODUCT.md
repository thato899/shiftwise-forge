# Product brief

Shiftwise helps operations and HR decide whether leave is safe for a shift and how to restore coverage when absences create gaps. Initial audience: maintenance operations with overlapping shifts. Codegeist category: Apps for Business Teams. Demonstration domain is engine maintenance; configuration supports other posts.

## People and permissions
Employee: view own schedule, request leave, opt into overtime and see decision status. Shift manager: set daily assignments within authorized site, inspect coverage, decide leave where delegated, publish overtime offers, confirm assignments. HR admin: maintain employees, credentials, skill taxonomy, grade eligibility, leave policies and manager authorization. Auditor: read redacted decision history. Deny all unauthorized cross-site and cross-tenant access.

## Domain rules
A shift has a site, time window and posts. Each post specifies minimum simultaneous staff, critical flag, required skills/credentials, optional eligible grades and maximum occupancy. An employee has availability, assigned shift, skills with expiry, grade and permitted posts. An eligible worker can cover at most one simultaneous post, even when qualified for several. Criticality determines urgency/escalation; every minimum must still be respected. Salary data is HR-restricted and must not be used as a proxy for qualification. If pay or grade affects movement, HR configures an explicit policy and captures its reason.

Evaluate leave against *remaining feasible assignments* for all affected windows, including existing approved leave, absences and accepted overtime. Return a human-readable explanation: minimum required, eligible available, actual assignment and deficit per post. A request stays pending until an authorized decision; deny or escalate if there is no feasible assignment. Changes after preview require reevaluation at decision time.

When an absence creates a gap, create an overtime opportunity for a specific post and window. Candidate filtering includes skill, credential validity, site, availability, rest interval, maximum hours and policy. Previous-shift workers may be invited if eligible; accepting an offer does not itself authorize an assignment. The manager confirms assignment and the engine recalculates coverage. Record offer, acceptance, approval and changes in audit history.

## Acceptance scenario
Day shift has four engine-maintenance qualified employees; minimum is three. One approved absence leaves three and can be covered. A second simultaneous leave request leaves two and must not be approved. The system shows the one-person deficit and eligible overtime candidates. A prior-shift qualified employee may accept only if rest/hour policy permits; manager confirms, the roster recalculates and only then can the leave decision be revisited.

## UX
Employee request form and status; manager shift board with coverage states and reasons; HR configuration; overtime inbox and response; audit view. Accessible labels, keyboard flow, timezone and date clarity, empty/error states, no sensitive pay details in employee view.

## Non-goals for first release
Payroll calculation, legal advice, automatic disciplinary decisions, forced overtime, production HR migration. Future: shift swaps, absence forecasts, fair overtime rotation, multi-site analytics and Rovo summaries.
