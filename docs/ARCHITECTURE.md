# Architecture and data contracts

Forge app with Jira global page for manager/HR workflows and employee-facing views. Forge resolver owns all mutations and authorization; Jira issues will record operational coverage exceptions and link decisions. Forge hosted storage will persist tenant-scoped records. Exact APIs and scopes are validated against current official Forge docs during foundation implementation.

## Domain and services
Entities: Site, PostRequirement, Shift, EmployeeProfile, Credential, Assignment, LeaveRequest, CoverageEvaluation, OvertimeOffer, OvertimeResponse, DecisionEvent. Records carry tenant/site identifiers, revision and timestamps. EmployeeProfile stores only necessary fields; grade/compensation policy remains HR-only.

Service boundaries: PolicyRepository; EligibilityService; CoverageSolver; LeaveDecisionService; OvertimeService; AuditService; JiraGateway. CoverageSolver evaluates a feasible matching for every required slot. Workers can cover multiple non-overlapping windows, but cannot cover two simultaneous slots. The current bounded search returns an explicit human-review error when it reaches its node limit. It does not silently claim infeasibility when the search is exhausted.

LeaveDecisionService must re-evaluate against current roster and policy revision before commit. OvertimeService creates invitations, records voluntary employee response separately from manager assignment, and checks that another active assignment does not conflict. Persistence must enforce cross-offer claims atomically; a pure domain revision check cannot prevent concurrent writes across separate records.

JiraGateway will use least privilege and idempotent issue creation for unresolved gaps.

## Security and consistency
Use trusted Forge invocation context for actor role and site checks on every resolver. Scope storage keys by installation/tenant and site. Validate inputs; audit policy and approval changes; never place salary values in Jira issues, notifications or logs. Stale decisions fail and trigger reevaluation. Unknown policy and qualifications are ineligible. Use synthetic fixtures only.

### Authorization contract (ticket #2)
Resolver services derive the actor from Forge's trusted `context.accountId` and `context.cloudId`. They load an `ActorGrant` by that identity from server-side storage, then authorize the requested permission against the record's server-loaded tenant and the grant's explicit site IDs. A payload-supplied role, account ID or tenant ID is never authority. Employee self-service additionally matches the employee ID linked in the grant. Site grants have no wildcard form.

`src/domain/authorization.ts` implements and tests this policy contract. It is not yet connected to a persistent grant repository or the resolver, so it is not production enforcement. Until that service is wired, sensitive workflows must remain unavailable; the current synthetic dashboard contains no employee records.

## CI
Install exact dependencies from both root and UI package lockfiles; run lint, typecheck, unit tests for matching/authorization/concurrency, UI build and Forge lint. CI never deploys to production or exposes Forge credentials to untrusted PRs. Deployment remains a documented manual action.
