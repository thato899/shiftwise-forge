# Security and privacy baseline

This is a development prototype. Do not connect real HR data until an access-control and privacy review is complete.

## Data and access
- Use synthetic employees in fixtures and public demonstrations.
- Authenticate each operation from trusted Forge invocation context; never trust a client-supplied role, site or employee ID as authorization.
- Scope stored records by Forge tenant/install context and site. Recheck access in every resolver.
- Resolve accountId and tenant identity from Forge resolver context, load the role/site grant server-side, and compare it with the tenant on the server-loaded record before every protected action. The requested site and employee IDs are selectors only.
- Give employees self-service access only to the employee ID linked to their grant. Managers and HR receive explicit site IDs; no cross-site wildcard is valid. HR-only profile/policy mutations, manager leave/assignment actions, and redacted auditor history are distinct permissions.
- Restrict grade, compensation and credential details to HR roles. Never place pay data in Jira issues, notifications, errors or logs.
- Use least privilege in manifest scopes and document each Jira API call.

## Decision safety
- Coverage must be evaluated deterministically with valid qualifications and simultaneous capacity constraints.
- Leave preview is advisory until an authorized manager decides; re-evaluate against current policy/roster revision when persisting.
- Overtime offers are invitations. Employee response and manager assignment are separate actions.
- Missing policy or invalid/expired credentials fail closed and route to human review.
- Persist an audit event for policy changes, leave decisions, offer publication/response and confirmed assignments.

## Before production
Threat model tenant isolation, resolver authorization, concurrency, Jira issue content, retention/deletion, data residency and applicable working-time law. Add a reviewed privacy notice and retention policy. Do not imply legal compliance without qualified review.

The authorization policy helper and synthetic tests exist, but the server-side grant repository and resolver integration do not. Do not expose HR or employee records until both are implemented and directly tested against forged payloads and cross-tenant/site access.
