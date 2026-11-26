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

## Current limits
There is no HR configuration screen or persistent data layer yet. These definitions and validation helpers do not constitute production authorization or legal compliance. Implementation proceeds through issues #1 and #2.
