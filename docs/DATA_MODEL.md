# Staffing data model

The initial domain types live in src/domain/models.ts. These are contracts for the prototype; persistent Forge storage and authoritative authorization are not yet wired.

## Boundaries
- Every operational record carries tenantId; siteId scopes manager authority and employee eligibility.
- Employee profiles contain grade, eligible posts, skills and credentials only. Do not store pay, phone, or home address in this model.
- A skill can count only when the profile declares it and any required credential covers the complete assignment window.
- Post rules require explicit minima, critical flag, required skill IDs and eligible grades. Empty/unreviewed policy cannot silently count workers.
- Working-time policy includes HR review state; overtime checks must fail closed until approved.
- Revisions support stale-preview detection. Before writing a decision, compare the submitted revision with current server-side state.
- All authorization is performed server-side from trusted Forge context; IDs supplied by UI are selectors, never proof of authorization.

## Actor grant contract
`ActorGrant` is the server-managed link between one Forge account and its Shiftwise role. It carries tenantId, accountId, role, explicit siteIds, optional employeeId for self-service, active state and revision. The grant must be fetched using trusted Forge context identity and scoped to the tenant before authorization. Never accept a grant object from UI payloads. HR grants are still site-scoped; employees are limited to their linked employeeId; auditor permission is limited to redacted history.

## Current limits
There is no HR configuration screen, persistent data layer or resolver authorization wiring yet. The authorization helper is a pure policy contract with synthetic tests, not deployed access control. These definitions and validation helpers do not constitute production authorization or legal compliance. Implementation proceeds through issues #1 and #2.
